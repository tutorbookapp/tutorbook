import to from 'await-to-js';

import { APIError } from 'lib/api/error';
import { Match } from 'lib/model';
import index from 'lib/api/algolia';

export default async function updateMatchSearchObj(
  match: Match
): Promise<void> {
  const [err] = await to(index('matches', match));
  if (err) {
    const msg = `${err.name} updating match (${match.toString()}) in Algolia`;
    throw new APIError(`${msg}: ${err.message}`, 500);
  }
}
