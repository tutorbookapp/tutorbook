import to from 'await-to-js';

import { APIError } from 'lib/api/error';
import { User } from 'lib/model';
import { db } from 'lib/api/firebase';

/**
 * Updates the Firestore database document for the given user.
 * @param user - The user whose document we want to update.
 * @return Promise that resolves to the updated user; throws an `APIError` if we
 * were unable to update the Firestore document.
 * @todo Inspect the Firestore documentation to ensure that `update()` behaves
 * the way that we want to.
 */
export default async function updateUserDoc(user: User): Promise<User> {
  const ref = db.collection('users').doc(user.id);
  const [err] = await to(ref.update(user.toFirestore()));
  if (err) {
    const msg = `${err.name} updating user (${user.toString()}) in database`;
    throw new APIError(`${msg}: ${err.message}`, 500);
  }
  return user;
}
