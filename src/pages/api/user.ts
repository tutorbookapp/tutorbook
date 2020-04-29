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
 * This is a desperate workaround for an error we're encountering regarding
 * Vercel Now environment variables. For some reason, it's formatting this
 * Firebase Admin Node.js SDK API key wrong and causing an error.
 * @see {@link https://github.com/tutorbookapp/covid-tutoring/issues/29}
 */
const FIREBASE_ADMIN_KEY: string =
  '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCusqyx2PhdhOV4\niYWgfwRkYznGfw/QODZ7WqKTY4D+OZrAuUqA2TrijRgc3XXhAklvz3pRScYoT899\nT9dnqKFkjEZHfujhCPRVM5KNntiMd+sQ+H8HcuKUTjHRK2y7PP+zbizYfeQN0Uuy\njoRBfDwzJmhzuKuJOLHWvAvyghEmwcjaNg0E4KrUbtB2MK9GjZQfmkWtNK5ioj6g\nTGeN/R0S2Ny9t0RQJbYNleSwG8VmRWqbFDkvlU7S9nHqgqCZKWJLrEZSRGaxphvN\neXqgRmtCskwGyiKZhmZXOp7wzTpqmyUgMhwm9X3tBaswWeNMuDU7+d//ivvgOQxV\nDd7kQ16xAgMBAAECggEADW7NMx6nGE/J8j8G0Jy7qnlrvZzTCzRrUghZ1GH0DvhA\ncz28IhSx/64QMtX/hKXvniKSufHlg/+BCZZsTnrrsAbON5ylTPpqiSueQvf6GDD3\nWPZ2lAzMKdGqaHZBldMeqT4ZQitJ8BsOCkSFnGBwY5F6Oh2yyOocWJHcjFDefz+K\nSwhW/cE70VUshFYi3Fuz/e0OgP0zyVRm6Us3gqtcxoPeN+w7jqmV/O8QO6OJWJqy\nq+ePN/ovZVentif+hXUm8WitSLqYS4ayMrmm/lv0BypO3SPu+yID1CU6s4//TDYs\n7b8SGG+tZFLFAtqQhWw4bknaURMRwN0do/GGPlajjQKBgQDWNsNA6Pa1VDhb7Ib3\nnoHo4jOMYwYYS9QdAGcrdUqsdL885LJgSY3LJqvTklXQFuIwM6otWT2yiTRuj7KV\nNmM/h76MfxbDSW+RjPzG+jP9UT+CGs+39xGdOteSp2PFun8o5gXn7MK09l2PUt2C\nnk9Qjv4qux7/w8MVNSwkpHc8HQKBgQDQxpia2jqtrWAbbpDAVL21mMPIT9k5695c\n388/bgLsrivgJbS9eRRSdZL/cJ3JtywYReYsOJ8/JIfbDbYdODGZHco0vkRboatv\nWA3EJVTr2RJ32uTVIs4/m/igksjA103GqUzj0kVJDwh2NXg+ZCBHxpXYp20st/hO\n7nGcyp4gpQKBgQCfCJMXCp22a2tYG5bsGTqbOexJSm8I9KrqSRVPN0oUFKyxuZwQ\nTis96lzguyCIV6TfYkvyVPGwLZrGhlpv2qv+S3oU9nlgzJFO/tvfoXudkodSwTL7\ngisKjtfiofE5p8amB3fVAnpfPRSixkN7qKp7xV0/PiK6gYzAnvRB0/RNpQKBgGYP\nj+6znFfnF8KRTIYZZxxtb9hu4HymR/ATIVeayic2BhDvnem6VSrye0gQn7JKr222\nTg10KLVPgHKfw1WJcQWvQHiEQxqgcBRgcWpf7aHWXmblRVTETRtffi3RU/6hwk3J\n2eLNmj1a8gIHpZ6qh/VOqVZeksp3rRW5DyVdD+xZAoGBAJCjUdlgCBee6uVUiCmh\nz01uN7tOMbxg1x71mdGUaoyJL4tj8lIQWKvDgDf3T6f27dB7Y+CY7Wr/LxTCAW3w\n/uVrz/BS4XC3VD7jvKADXq7RAYg1sJAto/wKCS5uvvv24nGKiy72/5mkn6Rp4dsn\n7LiDVx9tOLtqCwLNzUwFnKa5\n-----END PRIVATE KEY-----\n';

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
      privateKey: FIREBASE_ADMIN_KEY,
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
 *
 * @todo Send the `auth/phone-number-already-exists` error code back to the
 * client and show the user a warning message (in the form of a confirmation
 * dialog to ensure they're not accidentally creating duplicate accounts). I'm
 * guessing that this happens primarily b/c someone is registering themself as
 * both the parent and the pupil at the pupil signup form.
 */
async function updateUser(user: User): Promise<void> {
  const userRecord: UserRecord = await auth.getUserByEmail(user.email);
  const userNeedsToBeUpdated: boolean =
    (!!user.name && userRecord.displayName !== user.name) ||
    (!!user.photo && userRecord.photoURL !== user.photo) ||
    (!!user.phone && userRecord.phoneNumber !== user.phone);
  user.uid = userRecord.uid;
  if (userNeedsToBeUpdated) {
    const [err, updatedRecord] = await to<UserRecord, FirebaseError>(
      auth.updateUser(userRecord.uid, {
        displayName: user.name,
        photoURL: user.photo ? user.photo : undefined,
        phoneNumber: user.phone ? user.phone : undefined,
      })
    );
    if (err && err.code === 'auth/phone-number-already-exists') {
      // TODO: Send this error code back to the client and show the user a
      // warning message (in the form of a confirmation dialog to ensure they're
      // not accidentally creating duplicate accounts). I'm guessing that this
      // happens primarily b/c someone is registering themself as both the
      // parent and the pupil at the pupil signup form.
      const updatedRecord = await auth.updateUser(userRecord.uid, {
        displayName: user.name,
        photoURL: user.photo ? user.photo : undefined,
      });
      // Don't let the user delete past known info (e.g. if the old `userRecord`
      // has data that this new `User` doesn't; we don't just get rid of data).
      user.name = updatedRecord.displayName || userRecord.displayName || '';
      user.photo = updatedRecord.photoURL || userRecord.photoURL || '';
      user.phone = updatedRecord.phoneNumber || userRecord.phoneNumber || '';
    } else if (err) {
      throw err; // Errors are caught outside of this helper function.
    } else if (updatedRecord) {
      // Don't let the user delete past known info (e.g. if the old `userRecord`
      // has data that this new `User` doesn't; we don't just get rid of data).
      user.name = updatedRecord.displayName || userRecord.displayName || '';
      user.photo = updatedRecord.photoURL || userRecord.photoURL || '';
      user.phone = updatedRecord.phoneNumber || userRecord.phoneNumber || '';
    }
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
    /**
     * This `errHandled` variable is our current workaround to continue to
     * the `else` statement once we deal with known Firebase Admin Auth errors.
     * @see {@link https://firebase.google.com/docs/auth/admin/errors}
     */
    let errHandled: boolean = false;
    if (err && err.code === 'auth/email-already-exists') {
      console.log('[DEBUG] Handling email address already exists error...');
      const [err] = await to<void, FirebaseError>(updateUser(user));
      if (err) {
        error(`${err.name} updating (${user.email}): ${err.message}`, 500, err);
      } else {
        errHandled = true;
        // Note that the `user.uid` property was already set in `updateUser()`.
        console.log(`[DEBUG] Updated ${user.name}'s account (${user.uid}).`);
      }
    } else if (err && err.code === 'auth/phone-number-already-exists') {
      console.log('[DEBUG] Handling phone number already exists error...');
      const [err, userRecord] = await to<UserRecord, FirebaseError>(
        auth.createUser({
          disabled: false,
          displayName: user.name,
          photoURL: user.photo ? user.photo : undefined,
          email: user.email,
          emailVerified: false,
        })
      );
      if (err) {
        error(`${err.name} creating (${user.email}): ${err.message}`, 500, err);
      } else {
        errHandled = true;
        user.uid = (userRecord as UserRecord).uid;
        console.log(`[DEBUG] Created ${user.name}'s account (${user.uid}).`);
      }
    } else if (err) {
      console.error(`[ERROR] ${err.name} while creating user:`, err);
      error(`${err.name} creating (${user.email}): ${err.message}`, 500, err);
    } else {
      user.uid = (userRecord as UserRecord).uid;
      console.log(`[DEBUG] Created ${user.name}'s account (${user.uid}).`);
    }
    if (!err || errHandled) {
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
      console.log(`[DEBUG] Set ${user.name}'s profile doc (${user.uid}).`);
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
