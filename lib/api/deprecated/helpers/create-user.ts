import to from 'await-to-js';

import { User } from 'lib/model';

import {
  DocumentReference,
  DocumentSnapshot,
  FirebaseError,
  UserRecord,
  auth,
  db,
} from './firebase';

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
export default async function createUser(
  user: User,
  parents?: User[]
): Promise<void> {
  /* eslint-disable no-param-reassign, no-shadow */
  console.log(`[DEBUG] Creating user ${user.toString()}...`);
  await user.validatePhone();
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
    const [err, userRecord] = await to<UserRecord, FirebaseError>(
      auth.getUserByEmail(user.email)
    );
    if (err)
      throw new Error(
        `${err.name} fetching ${user.toString()}: ${err.message}`
      );
    user.id = (userRecord as UserRecord).uid;
    console.log(`[DEBUG] Fetched ${user.name}'s account (${user.id}).`);
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
  const userDoc: DocumentSnapshot = await userRef.get();
  if (userDoc.exists)
    throw new Error(
      `Profile (${user.id}) already exists. Call the '/api/users/${user.id}' ` +
        `endpoint instead.`
    );
  if (parents)
    await Promise.all(
      parents.map(async (parent: User) => {
        console.log(`[DEBUG] Creating parent ${parent.toString()}...`);
        const [err] = await to(createUser(parent));
        if (parent.id) {
          user.parents.push(parent.id);
        } else if (err) {
          throw new Error(`${err.name} creating parent: ${err.message}`);
        } else {
          throw new Error(`Parent (${parent.toString()}) did not have ID.`);
        }
        console.log(`[DEBUG] Created parent ${parent.toString()}.`);
      })
    );
  console.log('[DEBUG] Setting profile...');
  await userRef.set(user.toFirestore());
  console.log(`[DEBUG] Set ${user.name}'s profile (${user.id}).`);
  /* eslint-enable no-param-reassign, no-shadow */
}
