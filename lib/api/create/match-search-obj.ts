import to from 'await-to-js';

import { APIError } from 'lib/api/error';
import { Match } from 'lib/model/match';
import index from 'lib/api/algolia';

export default async function createMatchSearchObj(
  match: Match
): Promise<void> {
  const [err] = await to(index('matches', match));
  if (err) {
    const msg = `${err.name} saving match (${match.toString()}) to Algolia`;
    throw new APIError(`${msg}: ${err.message}`, 500);
  }
}
