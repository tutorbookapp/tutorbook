import to from 'await-to-js';

import { APIError } from 'lib/api/error';
import { Match } from 'lib/model/match';
import clone from 'lib/utils/clone';
import { db } from 'lib/api/firebase';

/**
 * Creates the Firestore database document for the given match.
 * @param match - The match to create a document for (we ignore its `id`).
 * @return Promise that resolves to the created match; throws an `APIError` if
 * we were unable to create the Firestore document.
 */
export default async function createMatchDoc(match: Match): Promise<Match> {
  const ref = db.collection('matches').doc();
  const copy = new Match(clone({ ...match, id: ref.id }));
  const [err] = await to(ref.set(copy.toFirestore()));
  if (err) {
    const msg = `${err.name} saving match (${match.toString()}) to database`;
    throw new APIError(`${msg}: ${err.message}`, 500);
  }
  return copy;
}
