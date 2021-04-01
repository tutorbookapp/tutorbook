import to from 'await-to-js';

import { APIError } from 'lib/api/error';
import { User } from 'lib/model/user';
import { db } from 'lib/api/firebase';

/**
 * Updates the Firestore database document for the given user.
 * @param user - The user whose document we want to update.
 * @return Promise that resolves to the updated user; throws an `APIError` if we
 * were unable to update the Firestore document.
 * @todo This won't error if the given document doesn't exist; we must use the
 * `DocumentReference#set` method in order to remove data. Should we error?
 */
export default async function updateUserDoc(user: User): Promise<void> {
  const ref = db.collection('users').doc(user.id);
  const [err] = await to(ref.set(user.toFirestore()));
  if (err) {
    const msg = `${err.name} updating user (${user.toString()}) in database`;
    throw new APIError(`${msg}: ${err.message}`, 500);
  }
}
