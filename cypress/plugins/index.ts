import path from 'path';

import axios from 'axios';
import codecov from '@cypress/code-coverage/task';
import dotenv from 'dotenv';
import firebase from 'firebase-admin';
import { percyHealthCheck } from '@percy/cypress/task';

import { IntercomGlobal } from 'lib/intercom';
import { MatchJSON } from 'lib/model/match';
import { MeetingJSON } from 'lib/model/meeting';
import { OrgJSON } from 'lib/model/org';
import { UserJSON } from 'lib/model/user';

import admin from 'cypress/fixtures/users/admin.json';
import match from 'cypress/fixtures/match.json';
import meeting from 'cypress/fixtures/meeting.json';
import org from 'cypress/fixtures/orgs/default.json';
import school from 'cypress/fixtures/orgs/school.json';
import student from 'cypress/fixtures/users/student.json';
import volunteer from 'cypress/fixtures/users/volunteer.json';

// Follow the Next.js convention for loading `.env` files.
// @see {@link https://nextjs.org/docs/basic-features/environment-variables}
[
  path.resolve(__dirname, `../../.env.${process.env.NODE_ENV || 'test'}.local`),
  path.resolve(__dirname, '../../.env.local'),
  path.resolve(__dirname, `../../.env.${process.env.NODE_ENV || 'test'}`),
  path.resolve(__dirname, '../../.env'),
].forEach((dotfile: string) => dotenv.config({ path: dotfile }));

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
    }
  }
}

export default function plugins(
  on: Cypress.PluginEvents,
  config: Cypress.PluginConfigOptions
): Cypress.ConfigOptions {
  codecov(on, config);
  on('task', {
    percyHealthCheck,
    async clear(): Promise<null> {
      const clearFirestoreEndpoint =
        `http://${process.env.FIRESTORE_EMULATOR_HOST as string}/emulator/v1/` +
        `projects/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID as string}/` +
        `databases/(default)/documents`;
      await axios.delete(clearFirestoreEndpoint);
      return null;
    },
    async seed(overrides: Overrides = {}): Promise<null> {
      let matches: MatchJSON[] = [];
      matches.push({ ...(match as MatchJSON), ...overrides.match });
      if (overrides.match === null) delete matches[0];
      matches = matches.filter(Boolean);

      let orgs: OrgJSON[] = [];
      orgs.push({ ...(org as OrgJSON), ...overrides.org });
      orgs.push({ ...(school as OrgJSON), ...overrides.school });
      if (overrides.org === null) delete orgs[0];
      if (overrides.school === null) delete orgs[1];
      orgs = orgs.filter(Boolean);

      let users: UserJSON[] = [];
      users.push({ ...(volunteer as UserJSON), ...overrides.volunteer });
      users.push({ ...(student as UserJSON), ...overrides.student });
      users.push({ ...(admin as UserJSON), ...overrides.admin });
      if (overrides.volunteer === null) delete users[0];
      if (overrides.student === null) delete users[1];
      if (overrides.admin === null) delete users[2];
      users = users.filter(Boolean);

      let meetings: MeetingJSON[] = [];
      meetings.push({ ...(meeting as MeetingJSON), ...overrides.meeting });
      if (overrides.meeting === null) delete meetings[0];
      meetings = meetings.filter(Boolean);

      async function create(route: string, data: unknown[]): Promise<void> {
        const endpoint = `http://localhost:3000/api/${route}`;
        await Promise.all(data.map((d) => axios.post(endpoint, d)));
      }

      await create('orgs', orgs);

      // We have to create the admin first because TB's back-end will try to
      // fetch his data when sending user creation notification emails.
      await create(
        'users',
        users.filter((u) => u.id === 'admin')
      );
      await create(
        'users',
        users.filter((u) => u.id !== 'admin')
      );

      await create('matches', matches);
      await create('meetings', meetings);

      return null;
    },
    async login(uid: string): Promise<string> {
      return auth.createCustomToken(uid);
    },
  });
  return { ...config, env: { ...config.env, ...clientCredentials } };
}
