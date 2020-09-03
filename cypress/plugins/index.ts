import path from 'path';

import admin from 'firebase-admin';
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
const firestore = app.firestore();
const db = firestore.collection('partitions').doc('test');

firestore.settings({ ignoreUndefinedProperties: true });

export default function plugins(on: Cypress.PluginEvents): void {
  on('task', {
    async clear() {
      const userIds = [user.id];
      const [_, userByEmail] = await to(auth.getUserByEmail(user.email));
      if (userByEmail) userIds.push(userByEmail.uid);
      const [_, userByPhone] = await to(auth.getUserByPhoneNumber(user.phone));
      if (userByPhone) userIds.push(userByPhone.uid);
      await Promise.all([auth.deleteUsers(userIds), db.delete()]);
      return null;
    },
    async seed() {
      await Promise.all([
        auth.createUser({
          email: user.email,
          displayName: user.name,
          photoURL: user.photo || undefined,
          phoneNumber: user.phone || undefined,
        }),
        db.set({}),
        db.collection('users').doc(user.id).set(user),
        db.collection('orgs').doc(org.id).set(org),
      ]);
      return null;
    },
  });
}
