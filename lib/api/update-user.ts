import { NextApiRequest, NextApiResponse } from 'next';
import { User, UserJSON } from 'lib/model';

import to from 'await-to-js';
import error from './helpers/error';
import verify from './helpers/verify';

import {
  db,
  auth,
  UserRecord,
  FirebaseError,
  DocumentSnapshot,
  DocumentReference,
} from './helpers/firebase';

/**
 * Don't let the user delete past known info (e.g. if the old `userRecord` has
 * data that this new `User` doesn't; we don't just get rid of data).
 *
 * Note that this function merely performs side-effects on the given user
 * object (and thus does not return anything).
 */
function preventDataLoss(
  user: User,
  userRecord: UserRecord,
  updatedRecord: UserRecord
): void {
  /* eslint-disable no-param-reassign */
  user.name = updatedRecord.displayName || userRecord.displayName || '';
  user.photo = updatedRecord.photoURL || userRecord.photoURL || '';
  user.email = updatedRecord.email || userRecord.email || '';
  user.phone = updatedRecord.phoneNumber || userRecord.phoneNumber || '';
  /* eslint-enable no-param-reassign */
}

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
async function updateUser(updatedUser: User): Promise<User> {
  console.log('[DEBUG] Updating Firebase Authorization account...');
  const user: User = new User(updatedUser);
  const [err, userRecord] = await to<UserRecord>(auth.getUser(user.id));
  if (err) {
    console.warn(`[WARNING] ${err.name} fetching user: ${err.message}`);
  } else {
    await user.validatePhone();
    const record: UserRecord = userRecord as UserRecord;
    const userNeedsToBeUpdated: boolean =
      (!!user.name && record.displayName !== user.name) ||
      (!!user.photo && record.photoURL !== user.photo) ||
      (!!user.email && record.displayName !== user.email) ||
      (!!user.phone && record.phoneNumber !== user.phone);
    user.id = record.uid;
    if (userNeedsToBeUpdated) {
      /* eslint-disable-next-line no-shadow */
      const [err, updatedRecord] = await to<UserRecord, FirebaseError>(
        auth.updateUser(user.id, {
          displayName: user.name,
          photoURL: user.photo ? user.photo : undefined,
          email: user.email ? user.email : undefined,
          phoneNumber: user.phone ? user.phone : undefined,
        })
      );
      if (err && err.code === 'auth/email-already-exists') {
        /* eslint-disable-next-line no-shadow */
        const updatedRecord = await auth.updateUser(user.id, {
          displayName: user.name,
          photoURL: user.photo ? user.photo : undefined,
          phoneNumber: user.phone ? user.phone : undefined,
        });
        preventDataLoss(user, record, updatedRecord);
      } else if (err && err.code === 'auth/phone-number-already-exists') {
        /* eslint-disable-next-line no-shadow */
        const updatedRecord = await auth.updateUser(user.id, {
          displayName: user.name,
          photoURL: user.photo ? user.photo : undefined,
          email: user.email ? user.email : undefined,
        });
        preventDataLoss(user, record, updatedRecord);
      } else if (err) {
        const msg = `${err.name} updating ${user.toString()}: ${err.message}`;
        throw new Error(msg);
      } else {
        preventDataLoss(user, record, updatedRecord as UserRecord);
      }
    }
    console.log('[DEBUG] Updated Firebase Authorization account.');
  }
  const userRef: DocumentReference = db.collection('users').doc(user.id);
  const userDoc: DocumentSnapshot = await userRef.get();
  console.log('[DEBUG] Updating profile document...');
  if (userDoc.exists) {
    await userRef.update(user.toFirestore());
    console.log(
      `[DEBUG] Updated ${user.name}'s profile document (${user.id}).`
    );
  } else {
    // Profile document did not already exist (as expected). Most likely this is
    // because we accidentally deleted it while migrating old data. This is not
    // an authentication bug however (as an error would have been thrown already
    // if the actual Firebase Authentication account also didn't already exist).
    console.warn('[WARNING] Profile document did not exist.');
    await userRef.set(user.toFirestore());
    console.log(`[DEBUG] Set ${user.name}'s profile document (${user.id}).`);
  }
  return user;
}

export type UpdateUserRes = UserJSON;

export default async function updateUserEndpoint(
  req: NextApiRequest,
  res: NextApiResponse<UpdateUserRes>
): Promise<void> {
  /* eslint-disable @typescript-eslint/no-unsafe-member-access */
  if (!req.body) {
    error(res, 'You must provide a request body.');
  } else if (typeof req.body.id !== 'string') {
    error(res, 'Your request body must contain a valid user ID.');
  } else {
    const user: User = User.fromJSON(req.body);
    await verify(req, res, user, async () => {
      await updateUser(user);
      res.status(200).json(user.toJSON());
    });
  }
  /* eslint-enable @typescript-eslint/no-unsafe-member-access */
}
