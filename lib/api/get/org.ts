import { APIError } from 'lib/api/error';
import { Org } from 'lib/model';
import { db } from 'lib/api/firebase';

/**
 * Gets the complete data for a given org ID.
 * @param id - The ID of the org (i.e. the ID of it's Firestore document).
 * @return Promise that resolves to the complete org data; throws an `APIError`
 * if we were unable to retrieve it from the Firestore database.
 */
export default async function getOrg(id: string): Promise<Org> {
  const doc = await db.collection('orgs').doc(id).get();
  if (!doc.exists) throw new APIError(`Org (${id}) does not exist in database`);
  return Org.fromFirestore(doc);
}
