import path from 'path';
import dotenv from 'dotenv';

// Follow the Next.js convention for loading `.env` files.
// @see {@link https://nextjs.org/docs/basic-features/environment-variables}
[
  path.resolve(__dirname, `../../.env.${process.env.NODE_ENV || 'test'}.local`),
  path.resolve(__dirname, '../../.env.local'),
  path.resolve(__dirname, `../../.env.${process.env.NODE_ENV || 'test'}`),
  path.resolve(__dirname, '../../.env'),
].forEach((dotfile: string) => dotenv.config({ path: dotfile }));

import codecov from '@cypress/code-coverage/task';
import firebase from 'firebase-admin';

import {
  DBMatch,
  DBRelationMatchPerson,
  Match,
  MatchJSON,
} from 'lib/model/match';
import {
  DBMeeting,
  DBRelationMeetingPerson,
  Meeting,
  MeetingJSON,
} from 'lib/model/meeting';
import { DBOrg, DBRelationMember, Org, OrgJSON } from 'lib/model/org';
import {
  DBUser,
  DBRelationOrg,
  DBRelationParent,
  User,
  UserJSON,
} from 'lib/model/user';
import { IntercomGlobal } from 'lib/intercom';
import supabase from 'lib/api/supabase';

import admin from 'cypress/fixtures/users/admin.json';
import match from 'cypress/fixtures/match.json';
import meeting from 'cypress/fixtures/meeting.json';
import org from 'cypress/fixtures/orgs/default.json';
import school from 'cypress/fixtures/orgs/school.json';
import student from 'cypress/fixtures/users/student.json';
import volunteer from 'cypress/fixtures/users/volunteer.json';

const clientCredentials = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = firebase.initializeApp({
  credential: firebase.credential.cert({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    privateKey: (process.env.FIREBASE_ADMIN_KEY || '').replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  }),
  serviceAccountId: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  databaseAuthVariableOverride: { uid: 'server' },
});
const auth = app.auth();

export interface Overrides {
  match?: Partial<MatchJSON> | null;
  meeting?: Partial<MeetingJSON> | null;
  org?: Partial<OrgJSON> | null;
  school?: Partial<OrgJSON> | null;
  volunteer?: Partial<UserJSON> | null;
  student?: Partial<UserJSON> | null;
  admin?: Partial<UserJSON> | null;
}

declare global {
  interface Window {
    Intercom: IntercomGlobal;
  }
  namespace Cypress {
    interface Chainable {
      task(event: 'clear'): Chainable<null>;
      task(event: 'seed', overrides?: Overrides): Chainable<null>;
      task(event: 'login', uid: string): Chainable<string>;
      task(event: 'cookie', jwt: string): Chainable<string>;
    }
  }
}

export default function plugins(
  on: Cypress.PluginEvents,
  config: Cypress.PluginConfigOptions
): Cypress.ConfigOptions {
  codecov(on, config);
  on('task', {
    async clear(): Promise<null> {
      await supabase.rpc('clear');
      return null;
    },
    async seed(overrides: Overrides = {}): Promise<null> {
      let orgs: Org[] = [];
      orgs.push(Org.fromJSON({ ...(org as OrgJSON), ...overrides.org }));
      orgs.push(Org.fromJSON({ ...(school as OrgJSON), ...overrides.school }));
      if (overrides.org === null) delete orgs[0];
      if (overrides.school === null) delete orgs[1];
      orgs = orgs.filter(Boolean);

      let users: User[] = [];
      const tutor = { ...(volunteer as UserJSON), ...overrides.volunteer };
      const tutee = { ...(student as UserJSON), ...overrides.student };
      const creator = { ...(admin as UserJSON), ...overrides.admin };
      users.push(User.fromJSON(tutor));
      users.push(User.fromJSON(tutee));
      users.push(User.fromJSON(creator));
      if (overrides.volunteer === null) delete users[0];
      if (overrides.student === null) delete users[1];
      if (overrides.admin === null) delete users[2];
      users = users.filter(Boolean).map((user) => {
        // Workaround for bug where custom array class methods disappear.
        // @see {@link https://github.com/cypress-io/cypress/issues/17603}
        user.availability.toDB = function toDB() {
          return Array.from(this.map((t) => t.toDB()));
        };
        return user;
      });

      let matches: Match[] = [];
      const matchJSON: MatchJSON = {
        ...(match as Omit<MatchJSON, 'creator' | 'people'>),
        creator,
        people: [
          { ...tutor, roles: ['tutor'] },
          { ...tutee, roles: ['tutee'] },
        ],
        ...overrides.match,
      };
      matches.push(Match.fromJSON(matchJSON));
      if (overrides.match === null) delete matches[0];
      matches = matches.filter(Boolean);

      let meetings: Meeting[] = [];
      const meetingJSON: MeetingJSON = {
        ...(meeting as Omit<MeetingJSON, 'creator' | 'match'>),
        creator,
        match: matchJSON,
        ...overrides.meeting,
      };
      meetings.push(Meeting.fromJSON(meetingJSON));
      if (overrides.meeting === null) delete meetings[0];
      meetings = meetings.filter(Boolean);

      await supabase.from<DBOrg>('orgs').insert(orgs.map((o) => o.toDB()));

      await supabase.from<DBUser>('users').insert(users.map((u) => u.toDB()));
      const parents = users
        .map((u) => u.parents.map((p) => ({ parent: p, user: u.id })))
        .flat();
      await supabase.from<DBRelationParent>('relation_parents').insert(parents);
      const userOrgs = users
        .map((u) => u.orgs.map((o) => ({ org: o, user: u.id })))
        .flat();
      await supabase.from<DBRelationOrg>('relation_orgs').insert(userOrgs);

      const members = orgs
        .map((o) => o.members.map((m) => ({ user: m, org: o.id })))
        .flat();
      await supabase.from<DBRelationMember>('relation_members').insert(members);

      const { data: matchesData } = await supabase
        .from<DBMatch>('matches')
        .insert(matches.map((m) => ({ ...m.toDB(), id: undefined })));
      const matchPeople = matches
        .map((m, idx) =>
          m.people.map((p) => ({
            user: p.id,
            roles: p.roles,
            match: matchesData ? matchesData[idx].id : Number(m.id),
          }))
        )
        .flat();
      await supabase
        .from<DBRelationMatchPerson>('relation_match_people')
        .insert(matchPeople);

      const { data: meetingsData } = await supabase
        .from<DBMeeting>('meetings')
        .insert(meetings.map((m) => ({ ...m.toDB(), id: undefined })));
      const meetingPeople = matches
        .map((m, idx) =>
          m.people.map((p) => ({
            user: p.id,
            roles: p.roles,
            meeting: meetingsData ? meetingsData[idx].id : Number(m.id),
          }))
        )
        .flat();
      await supabase
        .from<DBRelationMeetingPerson>('relation_meeting_people')
        .insert(meetingPeople);

      return null;
    },
    async login(uid: string): Promise<string> {
      return auth.createCustomToken(uid);
    },
    async cookie(jwt: string): Promise<string> {
      const expiresIn = 60 * 60 * 24 * 5 * 1000;
      return auth.createSessionCookie(jwt, { expiresIn });
    },
  });
  return { ...config, env: { ...config.env, ...clientCredentials } };
}
