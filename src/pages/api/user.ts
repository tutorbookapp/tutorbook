import { NextApiRequest, NextApiResponse } from 'next';
import { User, UserJSONInterface, ApiError } from '../../model';

import { v4 as uuid } from 'uuid';
import to from 'await-to-js';
import * as admin from 'firebase-admin';

type FirebaseError = admin.FirebaseError & Error;
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
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_ADMIN_KEY,
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
 * Helper function that's called when a user with the given email already
 * exists. This function will address the issue cleanly by:
 * 1. Fetching that user's existing Firebase `UserRecord`.
 * 2. (Optional) If that existing `UserRecord` doesn't match the given `user`,
 * we'll update it (**without** losing any user data).
 * 3. Finally, we'll update the given `User`'s properties to be in sync with
 * that stored in the latest Firebase `UserRecord`.
 *
 * Note that this function **will not** erase any data; if a piece of data (e.g.
 * the user's `phoneNumber`) is found in the Firebase `UserRecord` but not on
 * the given `User` object, we'll just add the value found in Firebase to the
 * given `User` object.
 *
 * @todo Enable users to remove their phone numbers and other sensitive PII as
 * they please (see above note for more info on why that's not working now).
 */
async function updateUser(user: User): Promise<void> {
  const userRecord: UserRecord = await auth.getUserByEmail(user.email);
  const userNeedsToBeUpdated: boolean =
    (!!user.name && userRecord.displayName !== user.name) ||
    (!!user.photo && userRecord.photoURL !== user.photo) ||
    (!!user.phone && userRecord.phoneNumber !== user.phone);
  user.uid = userRecord.uid;
  if (userNeedsToBeUpdated) {
    const updatedRecord: UserRecord = await auth.updateUser(userRecord.uid, {
      displayName: user.name,
      photoURL: user.photo ? user.photo : undefined,
      phoneNumber: user.phone ? user.phone : undefined,
    });
    // Don't let the user delete past known info (e.g. if the old `userRecord`
    // has data that this new `User` doesn't; we don't just get rid of data).
    user.name = updatedRecord.displayName || userRecord.displayName || '';
    user.photo = updatedRecord.photoURL || userRecord.photoURL || '';
    user.phone = updatedRecord.phoneNumber || userRecord.phoneNumber || '';
  }
}

/**
 * Takes the parsed results of a sign-up form (e.g. the `hero-form`) and:
 * 1. Creates and signs-in a new Firebase Authentication user.
 * 2. (Optional) Creates a new Firesbase Authentication user for the parents.
 * 3. (Optional) Creates a new Firestore profile document for the parents.
 * 4. Creates a new Firestore profile document for the given user.
 * 5. Sends an email verification link to the new user (and his/her parents).
 *
 * Note that this endpoint **will still function** if a user with the given
 * email already exists. If that is the case, we'll just update that user's info
 * to match the newly given info and respond with a login token as normal.
 *
 * @param {User} user - The user to create (should be in JSON form).
 * @param {User[]} [parents] - The parents of the given user to create (also in
 * JSON form).
 *
 * @return {{ token: string }} A custom Firebase Authentication login token
 * (that can be used to log the user into Firebase client-side; a requirement to
 * retrieve the user's JWT for subsequent API requests).
 */
export default async function user(
  req: NextApiRequest,
  res: NextApiResponse<ApiError | { user: UserJSONInterface }>
): Promise<void> {
  function error(msg: string, code: number = 400, err?: Error): void {
    res.status(code).send(Object.assign({ msg }, err || {}));
  }
  if (!req.body) {
    error('You must provide a request body.');
  } else if (!req.body.user) {
    error('Your request body must contain a user field.');
  } else {
    const user: User = User.fromJSON(req.body.user);
    const [err, userRecord] = await to<UserRecord, FirebaseError>(
      auth.createUser({
        disabled: false,
        displayName: user.name,
        photoURL: user.photo ? user.photo : undefined,
        email: user.email,
        emailVerified: false,
        phoneNumber: user.phone ? user.phone : undefined,
      })
    );
    // This `errorOverride` variable is our current workaround to continue to
    // the `else` statement once we deal with a `auth/email-already-exists` err.
    let errorOverride: boolean = false;
    if (err && err.code === 'auth/email-already-exists') {
      const [err] = await to<void, FirebaseError>(updateUser(user));
      if (err) {
        error(`${err.name} updating (${user.email}): ${err.message}`, 500, err);
      } else {
        errorOverride = true;
        console.log(`[DEBUG] Updated ${user.name}'s account (${user.uid}).`);
      }
    } else if (err) {
      console.error(`[ERROR] ${err.name} while creating user:`, err);
      error(`${err.name} creating (${user.email}): ${err.message}`, 500, err);
    } else {
      user.uid = (userRecord as UserRecord).uid;
      console.log(`[DEBUG] Created ${user.name}'s account (${user.uid}).`);
    }
    if (!err || errorOverride) {
      const userRef: DocumentReference = db.collection('users').doc(user.uid);
      if (req.body.parents && req.body.parents instanceof Array) {
        for (const parentData of req.body.parents) {
          const parent: User = User.fromJSON(parentData);
          const [err, parentRecord] = await to<UserRecord, FirebaseError>(
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
            console.log(`[DEBUG] Created ${parent.name} (${parent.uid}).`);
            parent.uid = (parentRecord as UserRecord).uid;
            user.parents.push(parent.uid);
            const parentRef: DocumentReference = db
              .collection('users')
              .doc(parent.uid);
            await parentRef.set(parent.toFirestore());
          }
        }
      }
      await userRef.set(user.toFirestore());
      const [err, token] = await to<string, FirebaseError>(
        auth.createCustomToken(user.uid)
      );
      if (err) {
        console.error(`[ERROR] ${err.name} while creating login token:`, err);
        error(`${err.name} creating login token: ${err.message}`, 500, err);
      } else {
        user.token = token;
        res.status(201).json({ user: user.toJSON() });
      }
    }
  }
}
