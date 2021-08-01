import to from 'await-to-js';

import { FirebaseError, auth } from 'lib/api/firebase';
import { APIError } from 'lib/api/error';

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

import phone from 'phone';
import to from 'await-to-js';
import { v4 as uuid } from 'uuid';

import { FirebaseError, UserRecord, auth } from 'lib/api/firebase';
import { APIError } from 'lib/api/error';
import { User } from 'lib/model/user';
import clone from 'lib/utils/clone';

/**
 * Creates the Firebase Authentication account for the given user.
 * @param user - The user to create the account for.
 * @return Promise that resolves to the created user; throws an `APIError` if we
 * were unable to create the Firebase Authentication account.
 * @todo Handle common Firebase Authentication errors such as
 * `auth/phone-number-already-exists` or `auth/email-already-exists`.
 */
export default async function createAuthUser(user: User): Promise<User> {
  const [err, userRecord] = await to<UserRecord, FirebaseError>(
    auth.createUser({
      disabled: false,
      email: user.email || undefined,
      emailVerified: false,
      displayName: user.name,
      photoURL: user.photo || undefined,
      phoneNumber: phone(user.phone)[0],
    })
  );
  if (err) {
    // TODO: Find a better way to setup my testing environment such that I don't
    // have to add these error handling exceptions. Ideally, I should be able to
    // manipulate the state of my authentication backend during tests.
    if (
      ['development', 'test'].includes(process.env.APP_ENV as string) &&
      [
        'auth/email-already-exists',
        'auth/phone-number-already-exists',
      ].includes(err.code)
    )
      return User.parse(clone({ ...user, id: user.id || uuid() }));
    const msg = `${err.name} (${err.code}) creating auth account`;
    throw new APIError(`${msg} for ${user.toString()}: ${err.message}`, 500);
  }
  const record = userRecord as UserRecord;
  const createdUser = User.parse(
    clone({
      ...user,
      email: record.email,
      phone: record.phoneNumber,
      photo: record.photoURL,
      name: record.displayName,
      id: record.uid,
    })
  );
  return createdUser;
}
