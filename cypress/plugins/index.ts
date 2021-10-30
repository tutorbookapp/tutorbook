/* eslint-disable import/first */
import path from 'path';

/* eslint-disable-next-line import/order */
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
  DBMeeting,
  DBRelationMeetingSubject,
  DBRelationPerson,
  Meeting,
  MeetingJSON,
} from 'lib/model/meeting';
import { 
  DBOrg, 
  DBRelationMember, 
  DBRelationOrgSubject,
  Org, 
  OrgJSON 
} from 'lib/model/org';
import {
  DBRelationOrg,
  DBRelationParent,
  DBRelationUserSubject,
  DBUser,
  User,
  UserJSON,
} from 'lib/model/user';
import { IntercomGlobal } from 'lib/intercom';
import supabase from 'lib/api/supabase';

import admin from 'cypress/fixtures/users/admin.json';
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
      users = users.filter(Boolean);

      let meetings: Meeting[] = [];
      const meetingJSON: MeetingJSON = {
        ...(meeting as Omit<MeetingJSON, 'creator' | 'people'>),
        creator,
        people: [
          { ...tutor, roles: ['tutor'] }, 
          { ...tutee, roles: ['tutee'] },
        ],
        ...overrides.meeting,
      };
      meetings.push(Meeting.fromJSON(meetingJSON));
      if (overrides.meeting === null) delete meetings[0];
      meetings = meetings.filter(Boolean);

      let { error } = await supabase.from<DBOrg>('orgs').insert(orgs.map((o) => o.toDB()));
      if (error) throw new Error(`Error seeding orgs: ${error.message}`);
      const orgSubjects = orgs
        .map((o) => (o.subjects || []).map((s) => ({ subject: s.id, org: o.id })))
        .flat();
      ({ error } = await supabase.from<DBRelationOrgSubject>('relation_org_subjects').insert(orgSubjects));
      if (error) throw new Error(`Error seeding relation_org_subjects: ${error.message}`);

      ({ error } = await supabase.from<DBUser>('users').insert(users.map((u) => u.toDB())));
      if (error) throw new Error(`Error seeding users: ${error.message}`);
      const userSubjects = users
        .map((u) => u.subjects.map((s) => ({ subject: s.id, user: u.id })))
        .flat();
      ({ error } = await supabase.from<DBRelationUserSubject>('relation_user_subjects').insert(userSubjects));
      if (error) throw new Error(`Error seeding relation_user_subjects: ${error.message}`);
      const parents = users
        .map((u) => u.parents.map((p) => ({ parent: p, user: u.id })))
        .flat();
      ({ error } = await supabase.from<DBRelationParent>('relation_parents').insert(parents));
      if (error) throw new Error(`Error seeding relation_parents: ${error.message}`);
      const userOrgs = users
        .map((u) => u.orgs.map((o) => ({ org: o, user: u.id })))
        .flat();
      ({ error } = await supabase.from<DBRelationOrg>('relation_orgs').insert(userOrgs));
      if (error) throw new Error(`Error seeding relation_orgs: ${error.message}`);

      const members = orgs
        .map((o) => o.members.map((m) => ({ user: m, org: o.id })))
        .flat();
      ({ error } = await supabase.from<DBRelationMember>('relation_members').insert(members));
      if (error) throw new Error(`Error seeding relation_members: ${error.message}`);

      const { error: e, data: meetingsData } = await supabase
        .from<DBMeeting>('meetings')
        .insert(meetings.map((m) => {
          const row: Omit<DBMeeting, 'id'> & { id?: number } = m.toDB();
          delete row.id;
          return row;
        }));
      if (e) throw new Error(`Error seeding meetings: ${e.message}`);
      const meetingSubjects = meetings
        .map((m, idx) => 
          m.subjects.map((s) => ({ 
            subject: s.id, 
            meeting: meetingsData ? meetingsData[idx].id : Number(m.id) 
          }))
        )
        .flat();
      ({ error } = await supabase.from<DBRelationMeetingSubject>('relation_meeting_subjects').insert(meetingSubjects));
      if (error) throw new Error(`Error seeding relation_meeting_subjects: ${error.message}`);
      const meetingPeople = meetings
        .map((m, idx) =>
          m.people.map((p) => ({
            user: p.id,
            roles: p.roles,
            meeting: meetingsData ? meetingsData[idx].id : Number(m.id),
          }))
        )
        .flat();
      ({ error } = await supabase
        .from<DBRelationPerson>('relation_people')
        .insert(meetingPeople));
      if (error) throw new Error(`Error seeding relation_people: ${error.message}`);

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
