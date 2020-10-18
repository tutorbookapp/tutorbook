import to from 'await-to-js';

import { Match, Venue } from 'lib/model';
import { APIError } from 'lib/api/error';
import { db } from 'lib/api/firebase';
import clone from 'lib/utils/clone';

/**
 * Updates the Firestore database document for the given match.
 * @param match - The match to update a document for.
 * @return Promise that resolves to the updated match; throws an `APIError` if
 * we were unable to update the Firestore document.
 * @todo This won't error if the given document doesn't exist; we must use the
 * `DocumentReference#set` method in order to remove data. Should we error?
 */
export default async function updateMatchDoc(
  match: Match,
  venue: Venue
): Promise<Match> {
  const ref = db.collection('matches').doc(match.id);
  const copy = new Match(clone({ ...match, venue }));
  const [err] = await to(ref.set(copy.toFirestore()));
  if (err) {
    const msg = `${err.name} updating match (${match.toString()}) in database`;
    throw new APIError(`${msg}: ${err.message}`, 500);
  }
  return copy;
}
