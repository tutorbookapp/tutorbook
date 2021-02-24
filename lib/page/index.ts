import { GetStaticPathsResult } from 'next';

import { Org, OrgJSON } from 'lib/model';
import { db } from 'lib/api/firebase';

export interface PageProps {
  orgs: OrgJSON[];
}

export async function getPageProps(): Promise<{ props: PageProps }> {
  const { docs } = await db.collection('orgs').get();
  const orgs = docs.map((d) => Org.fromFirestoreDoc(d).toJSON());
  return { props: { orgs } };
}

export async function getPagePaths(): Promise<GetStaticPathsResult> {
  return { paths: [], fallback: true };
}
