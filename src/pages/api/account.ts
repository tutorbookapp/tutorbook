import { NextApiRequest, NextApiResponse } from 'next';
import { ApiError, User, UserJSON, Org } from '@tutorbook/model';

import { v4 as uuid } from 'uuid';
import * as admin from 'firebase-admin';
import to from 'await-to-js';

/**
 * Type aliases so that we don't have to type out the whole type. We could try
 * importing these directly from the `@firebase/firestore-types` or the
 * `@google-cloud/firestore` packages, but that's not recommended.
 * @todo Perhaps figure out a way to **only** import the type defs we need.
 */
type DocumentReference = admin.firestore.DocumentReference;
type DocumentSnapshot = admin.firestore.DocumentSnapshot;
type DecodedIdToken = admin.auth.DecodedIdToken;
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
 * @todo Lift this Firebase app definition to a top-level file that is imported
 * by all the `/api/` endpoints.
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

const auth: Auth = firebase.auth();
const db: DocumentReference =
  process.env.NODE_ENV === 'development'
    ? firebase.firestore().collection('partitions').doc('test')
    : firebase.firestore().collection('partitions').doc('default');

/**
 * Takes a `firebase.auth.currentUser`'s JWT (i.e. the `idToken`) and responds
 * with that user's data and the data of any orgs that user belongs to.
 * @param {string} token - The `idToken` JWT of the signed-in user passed as a
 * query param via the HTTP GET method.
 * @return { user: User, orgs: Org[] } The user's data and the data of any orgs
 * that user belongs to.
 */
export default async function account(
  req: NextApiRequest,
  res: NextApiResponse<ApiError | { user: UserJSON; orgs: Org[] }>
): Promise<void> {
  function error(msg: string, code = 400, err?: Error): void {
    console.error(`[ERROR] Sending client ${code} with msg (${msg})...`, err);
    res.status(code).json({ msg, ...(err || {}) });
  }
  if (!req.query.token || typeof req.query.token !== 'string') {
    error('You must provide a valid Firebase Auth JWT.', 401);
  } else {
    const [err, token] = await to<DecodedIdToken>(
      auth.verifyIdToken(req.query.token, true)
    );
    if (err) {
      error(`Your Firebase Auth JWT is invalid: ${err.message}`, 401, err);
    } else {
      const { uid } = token as DecodedIdToken;
      const doc: DocumentSnapshot = await db.collection('users').doc(uid).get();
      if (!doc.exists) {
        const msg: string =
          `Firestore profile document (${uid}) did not exist. You can create ` +
          `it by calling the '/api/user' REST API endpoint.`;
        error(msg, 500);
      } else {
        const user: User = User.fromFirestore(doc);
        /* eslint-disable-next-line no-shadow */
        const [err, orgs] = await to<Org[]>(
          Promise.all(
            user.orgs.map(async (id) => {
              const d: DocumentSnapshot = await db
                .collection('orgs')
                .doc(id)
                .get();
              if (!d.exists) throw new Error(`Org (${id}) did not exist.`);
              return Org.fromFirestore(d);
            })
          )
        );
        if (err) {
          error(err.message, 500);
        } else {
          res.status(200).json({ orgs: orgs as Org[], user: user.toJSON() });
        }
      }
    }
  }
}
