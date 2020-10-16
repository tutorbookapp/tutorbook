import to from 'await-to-js';

import { APIError } from 'lib/api/error';
import { db } from 'lib/api/firebase';

/**
 * Deletes the Firestore database document for the given user.
 * @param uid - The user ID whose document we want to delete.
 * @return Promise that resolves to nothing; throws an `APIError` if we were
 * unable to delete the Firestore document.
 */
export default async function deleteUserDoc(uid: string): Promise<void> {
  const [err] = await to(db.collection('users').doc(uid).delete());
  if (err) {
    const msg = `${err.name} deleting user (${uid}) from database`;
    throw new APIError(`${msg}: ${err.message}`, 500);
  }
}
