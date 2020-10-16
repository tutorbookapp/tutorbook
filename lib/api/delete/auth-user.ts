import to from 'await-to-js';

import { FirebaseError, auth } from 'lib/api/firebase';
import { APIError } from 'lib/api/error';

/**
 * Deletes the Firebase Authentication account for the given user.
 * @param uid - The user ID whose account we want to delete.
 * @return Promise that resolves to nothing; throws an `APIError` if we were
 * unable to delete the Firebase Authentication account.
 */
export default async function deleteAuthUser(uid: string): Promise<void> {
  const [err] = await to<void, FirebaseError>(auth.deleteUser(uid));
  if (err) {
    const msg = `${err.name} (${err.code}) deleting auth account (${uid})`;
    throw new APIError(`${msg}: ${err.message}`, 500);
  }
}
