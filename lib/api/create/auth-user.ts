import to from 'await-to-js';

import { FirebaseError, UserRecord, auth } from 'lib/api/helpers/firebase';
import { APIError } from 'lib/api/helpers/error';
import { User } from 'lib/model';
import clone from 'lib/utils/clone';

/**
 * Creates the Firebase Authentication account for the given user.
 * @param user - The user to create the account for.
 * @return Promise that resolves to the created user; throws an `APIError` if we
 * were unable to create the Firebase Authentication account.
 * @todo Perhaps remove the `validatePhone` method as it isn't used anywhere
 * else besides here.
 * @todo Handle common Firebase Authentication errors such as
 * `auth/phone-number-already-exists` or `auth/email-already-exists`.
 */
export default async function createAuthUser(user: User): Promise<User> {
  await user.validatePhone();
  const [err, userRecord] = await to<UserRecord, FirebaseError>(
    auth.createUser({
      disabled: false,
      email: user.email,
      emailVerified: false,
      displayName: user.name,
      photoURL: user.photo || undefined,
      phoneNumber: user.phone || undefined,
    })
  );
  if (err)
    throw new APIError(
      `${err.name} (${
        err.code
      }) creating auth account for ${user.toString()}: ${err.message}`,
      500
    );
  const record = userRecord as UserRecord;
  const createdUser = new User(
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
