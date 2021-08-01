import { ParsedUrlQuery } from 'querystring';

import { GetStaticPaths, GetStaticProps, GetStaticPropsContext } from 'next';
import to from 'await-to-js';
import { useRouter } from 'next/router';
import useSWR from 'swr';

import { EmptyHeader } from 'components/navigation';
import Home from 'components/home';
import Page from 'components/page';

import { Org, OrgJSON } from 'lib/model/org';
import { PageProps, getPageProps } from 'lib/page';
import { getOrg, getOrgs } from 'lib/api/db/org';
import { OrgContext } from 'lib/context/org';
import usePage from 'lib/hooks/page';
import { withI18n } from 'lib/intl';

import common from 'locales/en/common.json';
import home from 'locales/en/home.json';

interface HomePageProps extends PageProps {
  org?: OrgJSON;
}

function HomePage({ org: initialData, ...props }: HomePageProps): JSX.Element {
  const { query } = useRouter();
  const { data: org } = useSWR(
    typeof query.org === 'string' ? `/api/orgs/${query.org}` : null,
    { initialData, revalidateOnMount: true }
  );

  usePage({ name: 'Org Home', org: org?.id });

  return (
    <OrgContext.Provider value={{ org: org ? Org.fromJSON(org) : undefined }}>
      <Page
        title={`${org?.name || 'Loading'} - Tutorbook`}
        description={org?.bio}
        formWidth
        intercom
        {...props}
      >
        <EmptyHeader formWidth />
        <Home org={org ? Org.fromJSON(org) : undefined} />
      </Page>
    </OrgContext.Provider>
  );
}

interface HomePageQuery extends ParsedUrlQuery {
  org: string;
}

export const getStaticProps: GetStaticProps<
  HomePageProps,
  HomePageQuery
> = async (ctx: GetStaticPropsContext<HomePageQuery>) => {
  if (!ctx.params) throw new Error('Cannot fetch org w/out params.');
  const [error, org] = await to(getOrg(ctx.params.org));
  if (error || !org) return { notFound: true };
  const { props } = await getPageProps();
  return { props: { org: org.toJSON(), ...props }, revalidate: 1 };
};

export const getStaticPaths: GetStaticPaths<HomePageQuery> = async () => {
  const paths = (await getOrgs()).map((org) => ({ params: { org: org.id } }));
  return { paths, fallback: true };
};

export default withI18n(HomePage, { common, home });
