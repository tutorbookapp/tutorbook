import path from 'path';

import admin from 'firebase-admin';
import algoliasearch from 'algoliasearch';
import axios from 'axios';
import codecov from '@cypress/code-coverage/task';
import dotenv from 'dotenv';
import to from 'await-to-js';

import org from '../fixtures/org.json';
import user from '../fixtures/user.json';

// Right now, we can't use the `baseUrl` Typescript compiler options, so we
// can't use any of the existing type annotations in our app source code.
// @see {@link https://github.com/cypress-io/cypress/issues/7188}
// @see {@link https://github.com/cypress-io/cypress/issues/7006}
// import { Org, OrgJSON, User, UserJSON } from 'lib/model';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: (process.env.FIREBASE_ADMIN_KEY as string).replace(
      /\\n/g,
      '\n'
    ),
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  }),
  projectId: process.env.FIREBASE_PROJECT_ID,
  serviceAccountId: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  databaseAuthVariableOverride: { uid: 'server' },
});
const auth = app.auth();
const db = app.firestore();

db.settings({ ignoreUndefinedProperties: true });

const algoliaId = process.env.ALGOLIA_APP_ID as string;
const algoliaKey = process.env.ALGOLIA_ADMIN_KEY as string;
const client = algoliasearch(algoliaId, algoliaKey);
const index = client.initIndex('test-users');

export default function plugins(
  on: Cypress.PluginEvents,
  config: Cypress.PluginConfigOptions
): Cypress.ConfigOptions {
  codecov(on, config);
  on('task', {
    async clear(): Promise<null> {
      const userIds = [user.id];
      const [_, userByEmail] = await to(auth.getUserByEmail(user.email));
      if (userByEmail) userIds.push(userByEmail.uid);
      const [_, userByPhone] = await to(auth.getUserByPhoneNumber(user.phone));
      if (userByPhone) userIds.push(userByPhone.uid);
      const clearFirestoreEndpoint =
        `http://${process.env.FIRESTORE_EMULATOR_HOST as string}/emulator/v1/` +
        `projects/${process.env.FIREBASE_PROJECT_ID as string}/databases/` +
        `(default)/documents`;
      await Promise.all([
        index.clearObjects(),
        auth.deleteUsers(userIds),
        axios.delete(clearFirestoreEndpoint),
      ]);
      return null;
    },
    async seed(): Promise<null> {
      await Promise.all([
        auth.createUser({
          email: user.email,
          displayName: user.name,
          photoURL: user.photo || undefined,
          phoneNumber: user.phone || undefined,
        }),
        db.collection('users').doc(user.id).set(user),
        db.collection('orgs').doc(org.id).set(org),
      ]);
      return null;
    },
    async login(uid?: string): Promise<string> {
      return auth.createCustomToken(uid || user.id);
    },
  });
  const env = {
    FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
    FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
    FIREBASE_DATABASE_URL: process.env.FIREBASE_DATABASE_URL,
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
    FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
    FIREBASE_APP_ID: process.env.FIREBASE_APP_ID,
    FIREBASE_MEASUREMENT_ID: process.env.FIREBASE_MEASUREMENT_ID,
  };
  return { ...config, env: { ...config.env, ...env } };
}
