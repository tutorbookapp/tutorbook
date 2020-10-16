import to from 'await-to-js';

import { APIError } from 'lib/api/error';
import { deleteObj } from 'lib/api/algolia';

export default async function deleteMatchSearchObj(
  matchId: string
): Promise<void> {
  const [err] = await to(deleteObj('matches', matchId));
  if (err) {
    const msg = `${err.name} deleting match (${matchId}) from Algolia`;
    throw new APIError(`${msg}: ${err.message}`, 500);
  }
}
