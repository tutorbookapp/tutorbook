import to from 'await-to-js';

import { APIError } from 'lib/api/error';
import { Match } from 'lib/model/match';
import { db } from 'lib/api/firebase';

/**
 * Updates the Firestore database document for the given match.
 * @param match - The match to update a document for.
 * @return Promise that resolves to nothing; throws an `APIError` if we were
 * unable to update the Firestore document.
 * @todo This won't error if the given document doesn't exist; we must use the
 * `DocumentReference#set` method in order to remove data. Should we error?
 */
export default async function updateMatch(match: Match): Promise<void> {
  const ref = db.collection('matches').doc(match.id);
  const [err] = await to(ref.set(match.toFirestore()));
  if (err) {
    const msg = `${err.name} updating match (${match.toString()}) in database`;
    throw new APIError(`${msg}: ${err.message}`, 500);
  }
}
