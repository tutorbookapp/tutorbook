import to from 'await-to-js';

import { APIError } from 'lib/api/error';
import { deleteObj } from 'lib/api/algolia';

export default async function deleteUserSearchObj(uid: string): Promise<void> {
  const [err] = await to(deleteObj('users', uid));
  if (err) {
    const msg = `${err.name} deleting user (${uid}) from Algolia`;
    throw new APIError(`${msg}: ${err.message}`, 500);
  }
}
