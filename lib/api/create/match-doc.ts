import to from 'await-to-js';

import { Match, Venue } from 'lib/model';
import { db } from 'lib/api/helpers/firebase';
import APIError from 'lib/api/helpers/error';
import clone from 'lib/utils/clone';

/**
 * Creates the Firestore database document for the given match.
 * @param match - The match to create a document for.
 * @return Promise that resolves to the created match; throws an `APIError` if
 * we were unable to create the Firestore document.
 */
export default async function createMatchDoc(
  match: Match,
  venue: Venue
): Promise<Match> {
  const copy = new Match(clone({ ...match, venue }));
  const ref = db.collection('matches').doc();
  const [err] = await to(ref.set(copy.toFirestore()));
  if (err)
    throw new APIError(
      `${err.name} saving match to database: ${err.message}`,
      500
    );
  copy.id = ref.id;
  return copy;
}
