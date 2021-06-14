import { GetStaticPathsResult } from 'next';

import { Org, OrgJSON } from 'lib/model';
import { db } from 'lib/api/firebase';

// Orgs must be optional because they are undefined when Next.js renders the
// fallback page during build-time. They are updated afterwards.
// See: https://nextjs.org/docs/basic-features/data-fetching#fallback-true
// See: https://github.com/vercel/next.js/issues/14200
// See: https://github.com/vercel/next.js/issues/22507
export interface PageProps {
  orgs?: OrgJSON[];
}

export async function getPageProps(): Promise<{ props: PageProps }> {
  const { docs } = await db.collection('orgs').get();
  const orgs = docs.map((d) => Org.fromFirestoreDoc(d).toJSON());
  return { props: { orgs } };
}

export async function getPagePaths(): Promise<GetStaticPathsResult> {
  return { paths: [], fallback: true };
}
