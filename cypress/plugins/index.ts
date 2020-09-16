import path from 'path';

import algoliasearch from 'algoliasearch';
import axios from 'axios';
import codecov from '@cypress/code-coverage/task';
import dotenv from 'dotenv';
import firebase from 'firebase-admin';

import admin from '../fixtures/users/admin.json';
import student from '../fixtures/users/student.json';
import volunteer from '../fixtures/users/volunteer.json';

import org from '../fixtures/orgs/default.json';
import school from '../fixtures/orgs/school.json';

// Right now, we can't use the `baseUrl` Typescript compiler options, so we
// can't use any of the existing type annotations in our app source code.
// @see {@link https://github.com/cypress-io/cypress/issues/7188}
// @see {@link https://github.com/cypress-io/cypress/issues/7006}
// import { Org, OrgJSON, User, UserJSON } from 'lib/model';

// Follow the Next.js convention for loading `.env` files.
// @see {@link https://nextjs.org/docs/basic-features/environment-variables}
[
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, `../../.env.${process.env.NODE_ENV || 'test'}`),
  path.resolve(__dirname, '../../.env.local'),
  path.resolve(__dirname, `../../.env.${process.env.NODE_ENV || 'test'}.local`),
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
const db = app.firestore();

db.settings({ ignoreUndefinedProperties: true });

const algoliaId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID as string;
const algoliaKey = process.env.ALGOLIA_ADMIN_KEY as string;
const client = algoliasearch(algoliaId, algoliaKey);
const index = client.initIndex(`${process.env.NODE_ENV || 'test'}-users`);

declare global {
  /* eslint-disable-next-line @typescript-eslint/no-namespace */
  namespace Cypress {
    interface Chainable {
      task(event: 'clear'): Chainable<null>;
      task(event: 'seed', overrides?: Record<string, unknown>): Chainable<null>;
      task(event: 'login', uid?: string): Chainable<string>;
    }
  }
}

interface Overrides {
  volunteer?: Record<string, unknown>;
  student?: Record<string, unknown>;
  admin?: Record<string, unknown>;
}

export default function plugins(
  on: Cypress.PluginEvents,
  config: Cypress.PluginConfigOptions
): Cypress.ConfigOptions {
  codecov(on, config);
  on('task', {
    async clear(): Promise<null> {
      const userIds = new Set<string>();
      await Promise.all(
        [volunteer, student, admin].map(async (user) => {
          const { users } = await auth.getUsers([
            { uid: user.id },
            { email: user.email },
            { phoneNumber: user.phone },
          ]);
          users.forEach(({ uid }) => userIds.add(uid));
        })
      );
      const clearFirestoreEndpoint =
        `http://${process.env.FIRESTORE_EMULATOR_HOST as string}/emulator/v1/` +
        `projects/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID as string}/` +
        `databases/(default)/documents`;
      await Promise.all([
        auth.deleteUsers([...userIds]),
        index.clearObjects(),
        axios.delete(clearFirestoreEndpoint),
      ]);
      return null;
    },
    async seed(overrides?: Overrides): Promise<null> {
      const users = [volunteer, student, admin];
      if (overrides) {
        users[0] = { ...users[0], ...overrides.volunteer };
        users[1] = { ...users[1], ...overrides.student };
        users[2] = { ...users[2], ...overrides.admin };
      }
      const userSearchObjs = users.map((u) => ({ ...u, objectID: u.id }));
      const userRecords = users.map((u) => ({
        uid: u.id,
        email: u.email,
        phoneNumber: u.phone,
        displayName: u.name,
        photoURL: u.photo,
      }));
      await Promise.all([
        auth.importUsers(userRecords),
        index.saveObjects(userSearchObjs),
        db.collection('users').doc(users[0].id).set(users[0]),
        db.collection('users').doc(users[1].id).set(users[1]),
        db.collection('users').doc(users[2].id).set(users[2]),
        db.collection('orgs').doc(school.id).set(school),
        db.collection('orgs').doc(org.id).set(org),
      ]);
      return null;
    },
    async login(uid?: string): Promise<string> {
      const fallbackId = student.id || volunteer.id || admin.id;
      return auth.createCustomToken(uid || fallbackId);
    },
  });
  return { ...config, env: { ...config.env, ...clientCredentials } };
}
