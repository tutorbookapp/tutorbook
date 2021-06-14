import { DocumentSnapshot, db } from 'lib/api/firebase';
import { Org } from 'lib/model';

/**
 * Fetches the orgs that a given user is an admin of.
 * @param uid - The uID of the user to fetch orgs for.
 * @return Promise that resolves to the orgs that the given user is an admin of.
 */
export default async function getOrgsByAdminId(uid: string): Promise<Org[]> {
  return (
    await db.collection('orgs').where('members', 'array-contains', uid).get()
  ).docs.map((org: DocumentSnapshot) => Org.fromFirestoreDoc(org));
}
