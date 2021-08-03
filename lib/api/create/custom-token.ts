import to from 'await-to-js';

import { FirebaseError, auth } from 'lib/api/firebase';
import { APIError } from 'lib/model/error';

/**
 * Creates a custom login token that can be used by the client when they signup
 * with the deprecated org signup page.
 * @param uid - The user ID of the user to create the login token for.
 * @return Promise that resolves with the token string; throws an `APIError` if
 * we were unable to create a custom token.
 * @todo Remove this once we fix #116 and get rid of that signup page.
 */
export default async function createCustomToken(uid: string): Promise<string> {
  const [err, token] = await to<string, FirebaseError>(
    auth.createCustomToken(uid)
  );
  if (err) {
    const msg = `${err.name} (${err.code}) creating custom auth token`;
    throw new APIError(`${msg} for user (${uid}): ${err.message}`, 500);
  }
  return token as string;
}
