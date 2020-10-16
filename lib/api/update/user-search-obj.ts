import to from 'await-to-js';

import { APIError } from 'lib/api/error';
import { User } from 'lib/model';
import index from 'lib/api/algolia';

export default async function updateUserSearchObj(user: User): Promise<void> {
  const tags: string[] = [];
  if (!user.verifications.length) tags.push('not-vetted');

  const [err] = await to(index('users', user, tags));
  if (err) {
    const msg = `${err.name} updating user (${user.toString()}) in Algolia`;
    throw new APIError(`${msg}: ${err.message}`, 500);
  }
}
