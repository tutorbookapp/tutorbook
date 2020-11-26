import { ParsedUrlQuery } from 'querystring';

import { GetStaticPaths, GetStaticProps, GetStaticPropsContext } from 'next';
import { useRouter } from 'next/router';
import useSWR from 'swr';

import { EmptyHeader } from 'components/navigation';
import Page from 'components/page';
import UserDisplay from 'components/user/display';

import { Org, OrgJSON, User, UserJSON } from 'lib/model';
import { OrgContext } from 'lib/context/org';
import { db } from 'lib/api/firebase';
import getTruncatedUser from 'lib/api/get/truncated-user';
import getUser from 'lib/api/get/user';
import { usePage } from 'lib/hooks';
import { withI18n } from 'lib/intl';

import common from 'locales/en/common.json';
import match3rd from 'locales/en/match3rd.json';
import user from 'locales/en/user.json';

interface UserDisplayPageProps {
  user?: UserJSON;
  org?: OrgJSON;
}

function UserDisplayPage({
  user: initialData,
  org,
}: UserDisplayPageProps): JSX.Element {
  const { query } = useRouter();

  // TODO: The router query should update before Next.js fetches static props.
  // That way, SWR will fetch the full user data while Next.js fetches the
  // static props and SWR will then ignore the truncated data.
  // @see {@link https://github.com/vercel/next.js/issues/19492}
  const { data } = useSWR<UserJSON>(
    typeof query.id === 'string' ? `/api/users/${query.id}` : null,
    { initialData, revalidateOnMount: true }
  );

  usePage('User Home', org?.id);

  return (
    <OrgContext.Provider value={{ org: org ? Org.fromJSON(org) : undefined }}>
      <Page title={`${data?.name || 'Loading'} - Tutorbook`} formWidth>
        <EmptyHeader formWidth />
        <UserDisplay user={data ? User.fromJSON(data) : undefined} />
      </Page>
    </OrgContext.Provider>
  );
}

interface UserDisplayPageQuery extends ParsedUrlQuery {
  org: string;
  id: string;
}

// Only public (truncated) data is used when generating static pages. Once
// hydrated, SWR is used client-side to continually update the full page data.
export const getStaticProps: GetStaticProps<
  UserDisplayPageProps,
  UserDisplayPageQuery
> = async (ctx: GetStaticPropsContext<UserDisplayPageQuery>) => {
  if (!ctx.params) throw new Error('Cannot fetch org and user w/out params.');
  const doc = await db.collection('orgs').doc(ctx.params.org).get();
  if (!doc.exists) throw new Error(`Org (${doc.id}) doesn't exist.`);
  const org = Org.fromFirestore(doc);
  const user = getTruncatedUser(await getUser(ctx.params.id));
  return { props: { org: org.toJSON(), user: user.toJSON() }, revalidate: 1 };
};

// TODO: We want to statically generate skeleton loading pages for each org.
// @see {@link https://github.com/vercel/next.js/issues/14200}
// @see {@link https://github.com/vercel/next.js/discussions/14486}
export const getStaticPaths: GetStaticPaths<UserDisplayPageQuery> = async () => {
  return { paths: [], fallback: true };
};

export default withI18n(UserDisplayPage, { common, match3rd, user });
