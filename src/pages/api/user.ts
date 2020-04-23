import { NextApiRequest, NextApiResponse } from 'next';
import { User } from '../../model';

import { v4 as uuid } from 'uuid';
import to from 'await-to-js';
import * as admin from 'firebase-admin';

type DocumentReference = admin.firestore.DocumentReference;
type UserRecord = admin.auth.UserRecord;
type Auth = admin.auth.Auth;
type App = admin.app.App;

/**
 * Initializes a new `firebase.admin` instance with limited database/Firestore
 * capabilities (using the `databaseAuthVariableOverride` option).
 * @see {@link https://firebase.google.com/docs/reference/admin/node/admin.AppOptions#optional-databaseauthvariableoverride}
 * @see {@link https://firebase.google.com/docs/database/admin/start#authenticate-with-limited-privileges}
 *
 * Also note that we use [UUID]{@link https://github.com/uuidjs/uuid} package to
 * generate a unique `firebaseAppId` every time this API is called.
 * @todo Lift this Firebase app definition to a top-leve file that is imported
 * by all the `/api/` endpoints.
 */
const firebase: App = admin.initializeApp(
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
    databaseAuthVariableOverride: { uid: 'server' },
  },
  uuid()
);

const auth: Auth = firebase.auth();
const db: DocumentReference =
  process.env.NODE_ENV === 'development'
    ? firebase.firestore().collection('partitions').doc('test')
    : firebase.firestore().collection('partitions').doc('default');

/**
 * Takes the parsed results of a sign-up form (e.g. the `hero-form`) and:
 * 1. Creates and signs-in a new Firebase Authentication user.
 * 2. (Optional) Creates a new Firesbase Authentication user for the parent.
 * 3. (Optional) Creates a new Firestore profile document for the parent.
 * 4. Creates a new Firestore profile document for the given user.
 * 5. Sends an email verification link to the new user (and his/her parent).
 * @param {User} user - The user to create (should be in JSON form).
 * @param {User} [parent] - The parent of the given user to create (also JSON).
 */
export default async function user(
  req: NextApiRequest,
  res: NextApiResponse<void>
): Promise<void> {
  if (!req.body) {
    res.status(400).send('You must provide a request body.');
  } else if (!req.body.user) {
    res.status(400).send('Your request body must contain a user field.');
  } else {
    const user: User = User.fromJSON(req.body.user);
    const [err, userRecord] = await to<UserRecord>(
      auth.createUser({
        disabled: false,
        displayName: user.name,
        photoURL: user.photo ? user.photo : undefined,
        email: user.email,
        emailVerified: false,
        phoneNumber: user.phone ? user.phone : undefined,
      })
    );
    if (err) {
      console.error(`[ERROR] ${err.name} while creating user account:`, err);
      res
        .status(500)
        .send(`${err.name} while creating user account: ${err.message}`);
    } else {
      user.uid = userRecord.uid;
      console.log(`[DEBUG] Created ${user.name}'s account (${user.uid}).`);
      const userRef: DocumentReference = db.collection('users').doc(user.uid);
      if (req.body.parent) {
        const parent: User = User.fromJSON(req.body.parent);
        const [err, parentRecord] = await to<UserRecord>(
          auth.createUser({
            disabled: false,
            displayName: parent.name,
            photoURL: parent.photo ? parent.photo : undefined,
            email: parent.email,
            emailVerified: false,
            phoneNumber: parent.phone ? parent.phone : undefined,
          })
        );
        if (err) {
          console.warn(`[WARNING] ${err.name} while creating parent:`, err);
        } else {
          user.parent = parent.uid = parentRecord.uid;
          console.log(
            `[DEBUG] Created ${parent.name}'s account (${parent.uid}).`
          );
          const parentRef: DocumentReference = db
            .collection('users')
            .doc(parent.uid);
          await parentRef.set(parent.toFirestore());
        }
      }
      await userRef.set(user.toFirestore());
      const [err, token] = await to<string>(auth.createCustomToken(user.uid));
      if (err) {
        console.error(
          `[ERROR] ${err.name} while creating custom login token:`,
          err
        );
        res
          .status(500)
          .send(
            `${err.name} while creating custom login token: ${err.message}`
          );
      } else {
        res.status(201).json({ token });
      }
    }
  }
}
