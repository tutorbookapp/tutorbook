import { APIError } from 'lib/api/error';
import { Match } from 'lib/model';
import { db } from 'lib/api/firebase';

/**
 * Gets the complete data for a given match ID.
 * @param id - The ID of the match (i.e. the ID of it's Firestore document).
 * @return Promise that resolves to the complete match data; throws an `APIError`
 * if we were unable to retrieve it from the Firestore database.
 */
export default async function getMatch(id: string): Promise<Match> {
  const doc = await db.collection('matches').doc(id).get();
  if (!doc.exists)
    throw new APIError(`Match (${id}) does not exist in database`);
  return Match.fromFirestoreDoc(doc);
}
