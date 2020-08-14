import * as admin from 'firebase-admin';
import { v4 as uuid } from 'uuid';

export type FirebaseError = admin.FirebaseError & Error;

export type Firestore = admin.firestore.Firestore;
export type DocumentSnapshot = admin.firestore.DocumentSnapshot;
export type DocumentReference = admin.firestore.DocumentReference;
export type CollectionReference = admin.firestore.CollectionReference;

export type Auth = admin.auth.Auth;
export type UserRecord = admin.auth.UserRecord;
export type DecodedIdToken = admin.auth.DecodedIdToken;

export type App = admin.app.App;

/**
 * Initializes a new `firebase.admin` instance with limited database/Firestore
 * capabilities (using the `databaseAuthVariableOverride` option).
 * @see {@link https://firebase.google.com/docs/reference/admin/node/admin.AppOptions#optional-databaseauthvariableoverride}
 * @see {@link https://firebase.google.com/docs/database/admin/start#authenticate-with-limited-privileges}
 *
 * Also note that we use [UUID]{@link https://github.com/uuidjs/uuid} package to
 * generate a unique `firebaseAppId` every time this API is called.
 * @todo Lift this Firebase app definition to a top-level file that is imported
 * by all the `/api/` endpoints.
 *
 * We have a workaround for the `FIREBASE_ADMIN_KEY` error we were encountering
 * on Vercel a while ago.
 * @see {@link https://github.com/tutorbookapp/covid-tutoring/issues/29}
 * @see {@link https://stackoverflow.com/a/41044630/10023158}
 * @see {@link https://stackoverflow.com/a/50376092/10023158}
 */
const firebase: App = admin.initializeApp(
  {
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
  },
  uuid()
);

export const auth: Auth = firebase.auth();
export const firestore: Firestore = firebase.firestore();
export const db: DocumentReference =
  process.env.NODE_ENV === 'development'
    ? firestore.collection('partitions').doc('test')
    : firestore.collection('partitions').doc('default');

firestore.settings({ ignoreUndefinedProperties: true });
