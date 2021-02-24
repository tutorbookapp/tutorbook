import { Org, OrgJSON } from 'lib/model';
import { db } from 'lib/api/firebase';

export interface PageProps {
  orgs: OrgJSON[];
}

export async function getPageProps(): Promise<PageProps> {
  const { docs } = await db.collection('orgs').get();
  const orgs = docs.map((d) => Org.fromFirestoreDoc(d).toJSON());
  return { props: { orgs } };
}
