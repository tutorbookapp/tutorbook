import { NextApiRequest, NextApiResponse } from 'next';
import { DocumentReference } from '@google-cloud/firestore';
import { User } from '../../model';

import * as admin from 'firebase-admin';

/**
 * Initializes a new `firebase.admin` instance with limited database/Firestore
 * capabilities (using the `databaseAuthVariableOverride` option).
 * @see {@link https://firebase.google.com/docs/reference/admin/node/admin.AppOptions#optional-databaseauthvariableoverride}
 * @see {@link https://firebase.google.com/docs/database/admin/start#authenticate-with-limited-privileges}
 */
const firebase: admin.app.App = admin.initializeApp(
  {
    credential: admin.credential.cert({
      type: process.env.FIREBASE_ADMIN_TYPE,
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_ADMIN_KEY_ID,
      private_key: process.env.FIREBASE_ADMIN_KEY,
      client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_ADMIN_CLIENT_ID,
      auth_uri: process.env.FIREBASE_ADMIN_AUTH_URI,
      token_uri: process.env.FIREBASE_ADMIN_TOKEN_URI,
      auth_provider_x509_cert_url: process.env.FIREBASE_ADMIN_PROVIDER_CERT_URL,
      client_x509_cert_url: process.env.FIREBASE_ADMIN_CLIENT_CERT_URL,
    }),
    projectId: process.env.FIREBASE_PROJECT_ID,
    serviceAccountId: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    databaseAuthVariableOverride: {
      uid: 'server',
    },
  },
  'server'
);

/**
 * Takes the parsed results of a sign-up form (e.g. the `hero-form`) and creates
 * a new Firestore Authentication user, Firestore profile document, and sends an
 * email sign-in link to that user.
 * @param {User} user - The user to create (should be in JSON form).
 * @param {User} [parent] - The parent of the given user to create (also JSON).
 */
export default async function signup(
  req: NextApiRequest,
  res: NextApiResponse<void>
): Promise<void> {
  if (!req.body) {
    res.status(400).send('You must provide a request body.');
  } else if (!req.body.user) {
    res.status(400).send('Your request body must contain a user field.');
  } else {
    const db: DocumentReference =
      process.env.NODE_ENV === 'development'
        ? firebase.firestore().collection('partitions').doc('test')
        : firebase.firestore().collection('partitions').doc('default');
    const user: User = User.fromJSON(req.body.user);
    const userRef: DocumentReference = db.collection('users').doc();
    if (req.body.parent) {
      const parent: User = User.fromJSON(req.body.parent);
      const parentRef: DocumentReference = db.collection('users').doc();
      user.parent = parentRef.id;
      await parentRef.set(parent.toFirestore());
    }
    await userRef.set(user.toFirestore());
    res.status(200).send(`Successfully created user (${userRef.id}).`);
  }
}
