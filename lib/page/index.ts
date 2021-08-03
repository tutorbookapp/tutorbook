import { GetStaticPathsResult } from 'next';

import { DBViewOrg, Org, OrgJSON } from 'lib/model/org';
import supabase from 'lib/api/supabase';

export interface PageProps {
  orgs?: OrgJSON[];
}

// TODO: Remove this temporary fix for Next.js's tree-shaking bug where it
// doesn't get rid of re-exported imports and replace it with `getOrgs`.
// @see {@link https://github.com/vercel/next.js/issues/27741}
export async function getPageProps(): Promise<{ props: PageProps }> {
  const { data } = await supabase.from<DBViewOrg>('view_orgs').select();
  const orgs = (data || []).map((d) => Org.fromDB(d).toJSON());
  return { props: { orgs } };
}

export async function getPagePaths(): Promise<GetStaticPathsResult> {
  return { paths: [], fallback: true };
}
