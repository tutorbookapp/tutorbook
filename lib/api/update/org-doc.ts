import to from 'await-to-js';

import { APIError } from 'lib/api/error';
import { Org } from 'lib/model';
import { db } from 'lib/api/firebase';

/**
 * Updates the Firestore database document for the given org.
 * @param org - The org whose document we want to update.
 * @return Promise that resolves to the updated org; throws an `APIError` if we
 * were unable to update the Firestore document.
 * @todo This won't error if the given document doesn't exist; we must use the
 * `DocumentReference#set` method in order to remove data. Should we error?
 */
export default async function updateOrgDoc(org: Org): Promise<Org> {
  const ref = db.collection('orgs').doc(org.id);
  const [err] = await to(ref.set(org.toFirestore()));
  if (err) {
    const msg = `${err.name} updating org (${org.toString()}) in database`;
    throw new APIError(`${msg}: ${err.message}`, 500);
  }
  return org;
}
