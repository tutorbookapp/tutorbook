import to from 'await-to-js';

import { APIError } from 'lib/api/error';
import { Org } from 'lib/model';
import { db } from 'lib/api/firebase';
import clone from 'lib/utils/clone';

/**
 * Creates the Firestore database document for the given org.
 * @param org - The org to create a document for (must already have an `id`).
 * @return Promise that resolves to the created org; throws an `APIError` if we
 * were unable to create the Firestore document.
 */
export default async function createOrgDoc(org: Org): Promise<Org> {
  const copy = new Org(clone(org));
  const doc = await db.collection('orgs').doc(org.id).get();
  if (doc.exists) {
    const msg = `Org (${org.toString()}) already exists in database`;
    throw new APIError(msg, 400);
  }
  const [err] = await to(doc.ref.set(copy.toFirestore()));
  if (err) {
    const msg = `${err.name} saving org (${org.toString()}) in database`;
    throw new APIError(`${msg}: ${err.message}`, 500);
  }
  return copy;
}
