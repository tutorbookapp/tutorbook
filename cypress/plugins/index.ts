import path from 'path';

import admin from 'firebase-admin';
import algoliasearch from 'algoliasearch';
import axios from 'axios';
import codecov from '@cypress/code-coverage/task';
import dotenv from 'dotenv';

import org from '../fixtures/org.json';
import user from '../fixtures/user.json';

import generateUserInfo from './generate-user-info';

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
const app = admin.initializeApp({
  credential: admin.credential.cert({
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

export default function plugins(
  on: Cypress.PluginEvents,
  config: Cypress.PluginConfigOptions
): Cypress.ConfigOptions {
  codecov(on, config);
  on('task', {
    async clear(): Promise<null> {
      const { users } = await auth.getUsers([
        { uid: Cypress.env('id') as string },
        { email: Cypress.env('email') as string },
        { phoneNumber: Cypress.env('phone') as string },
      ]);
      const clearFirestoreEndpoint =
        `http://${process.env.FIRESTORE_EMULATOR_HOST as string}/emulator/v1/` +
        `projects/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID as string}/` +
        `databases/(default)/documents`;
      await Promise.all([
        index.clearObjects(),
        auth.deleteUsers(users.map(({ uid }) => uid)),
        axios.delete(clearFirestoreEndpoint),
      ]);
      return null;
    },
    async seed(): Promise<null> {
      const userData = { ...user, ...generateUserInfo() };
      const userSearchData = { ...userData, objectID: userData.id };
      await Promise.all([
        auth.createUser({
          uid: userData.id,
          email: userData.email,
          phoneNumber: userData.phone,
          displayName: userData.name,
          photoURL: userData.photo,
        }),
        index.saveObject(userSearchData),
        db.collection('users').doc(userData.id).set(userData),
        db.collection('orgs').doc(org.id).set(org),
      ]);
      return null;
    },
    async login(uid?: string): Promise<string> {
      return auth.createCustomToken(uid || Cypress.env('id'));
    },
  });
  return { ...config, env: { ...config.env, ...clientCredentials } };
}
