/* eslint-disable no-shadow */

import { NextApiRequest, NextApiResponse } from 'next';
import { User, UserJSON, ApiError } from '@tutorbook/model';
import { SignUpEmail } from '@tutorbook/emails';

import to from 'await-to-js';
import mail from '@sendgrid/mail';
import {
  db,
  auth,
  UserRecord,
  FirebaseError,
  DocumentSnapshot,
  DocumentReference,
} from '@tutorbook/admin';

mail.setApiKey(process.env.SENDGRID_API_KEY as string);

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
  /* eslint-disable no-param-reassign */
  const userRecord: UserRecord = await auth.getUserByEmail(user.email);
  const userNeedsToBeUpdated: boolean =
    (!!user.name && userRecord.displayName !== user.name) ||
    (!!user.photo && userRecord.photoURL !== user.photo) ||
    (!!user.phone && userRecord.phoneNumber !== user.phone);
  user.id = userRecord.uid;
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
      throw new Error(
        `${err.name} updating ${user.toString()}: ${err.message}`
      );
    } else if (updatedRecord) {
      // Don't let the user delete past known info (e.g. if the old `userRecord`
      // has data that this new `User` doesn't; we don't just get rid of data).
      user.name = updatedRecord.displayName || userRecord.displayName || '';
      user.photo = updatedRecord.photoURL || userRecord.photoURL || '';
      user.phone = updatedRecord.phoneNumber || userRecord.phoneNumber || '';
    }
  }
  /* eslint-enable no-param-reassign */
}

/**
 * Creates a new user and handles various errors:
 * - The `auth/email-already-exists` error by updating the existing error (see
 *   the above helper function for how that's implemented).
 * - The `auth/phone-number-already-exists` error by creating the user w/out the
 *   given phone number (this is a bit hacky and we might want to re-think it
 *   later on).
 *
 * While this function doesn't actually return anything, it does perform side
 * effects on the given `user` object (i.e. adding the uID).
 */
async function createUser(user: User, parents?: User[]): Promise<void> {
  /* eslint-disable no-param-reassign */
  console.log(`[DEBUG] Creating user ${user.toString()}...`);
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
  if (err && err.code === 'auth/email-already-exists') {
    console.log('[DEBUG] Handling email address already exists error...');
    await updateUser(user); // Errors are already thrown in the helper function.
    // Note that the `user.id` property was already set in `updateUser()`.
    console.log(`[DEBUG] Updated ${user.name}'s account (${user.id}).`);
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
    if (err)
      throw new Error(
        `${err.name} creating ${user.toString()}: ${err.message}`
      );
    user.id = (userRecord as UserRecord).uid;
    console.log(`[DEBUG] Created ${user.name}'s account (${user.id}).`);
  } else if (err) {
    throw new Error(`${err.name} creating ${user.toString()}: ${err.message}`);
  } else {
    user.id = (userRecord as UserRecord).uid;
    console.log(`[DEBUG] Created ${user.name}'s account (${user.id}).`);
  }
  const userRef: DocumentReference = db.collection('users').doc(user.id);
  if (parents) {
    await Promise.all(
      parents.map(async (parent: User) => {
        console.log(`[DEBUG] Creating parent ${parent.toString()}...`);
        await createUser(parent);
        user.parents.push(parent.id);
        console.log(`[DEBUG] Created parent ${parent.toString()}.`);
      })
    );
  }
  const userDoc: DocumentSnapshot = await userRef.get();
  if (userDoc.exists) {
    console.log('[DEBUG] Updating profile...');
    await userRef.update(user.toFirestore());
    console.log(`[DEBUG] Updated ${user.name}'s profile (${user.id}).`);
  } else {
    console.log('[DEBUG] Setting profile...');
    await userRef.set(user.toFirestore());
    console.log(`[DEBUG] Set ${user.name}'s profile (${user.id}).`);
  }
  /* eslint-enable no-param-reassign */
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
  res: NextApiResponse<ApiError | { user: UserJSON }>
): Promise<void> {
  /* eslint-disable @typescript-eslint/no-unsafe-member-access */
  function error(msg: string, code = 400, err?: Error): void {
    console.error(`[ERROR] Sending client ${code} with msg (${msg})...`, err);
    res.status(code).send({ msg, ...(err || {}) });
  }
  if (!req.body) {
    error('You must provide a request body.');
  } else if (!req.body.user) {
    error('Your request body must contain a user field.');
  } else {
    const user: User = User.fromJSON(req.body.user);
    const parents: User[] = (
      (req.body.parents as UserJSON[]) || []
    ).map((parentJSON: UserJSON) => User.fromJSON(parentJSON));
    const [err] = await to(createUser(user, parents));
    if (err) {
      error(err.message, 500, err);
    } else {
      const [err, token] = await to<string, FirebaseError>(
        auth.createCustomToken(user.id)
      );
      if (err) {
        error(`${err.name} creating login token: ${err.message}`, 500, err);
      } else {
        user.token = token;
        res.status(201).json({ user: user.toJSON() });
        await mail.send(new SignUpEmail(user));
      }
    }
  }
  /* eslint-enable @typescript-eslint/no-unsafe-member-access */
}
