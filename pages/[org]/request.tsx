import { ParsedUrlQuery } from 'querystring';

import { GetStaticPaths, GetStaticProps, GetStaticPropsContext } from 'next';
import to from 'await-to-js';

import { EmptyHeader } from 'components/navigation';
import Page from 'components/page';
import Request from 'components/request';

import { Org, OrgJSON } from 'lib/model/org';
import { PageProps, getPageProps } from 'lib/page';
import { getOrg, getOrgs } from 'lib/api/db/org';
import { OrgContext } from 'lib/context/org';
import usePage from 'lib/hooks/page';
import { withI18n } from 'lib/intl';

import common from 'locales/en/common.json';
import user3rd from 'locales/en/user3rd.json';

interface RequestPageProps extends PageProps {
  org?: OrgJSON;
}

function RequestPage({ org, ...props }: RequestPageProps): JSX.Element {
  usePage('Org Request');

  return (
    <OrgContext.Provider value={{ org: org ? Org.fromJSON(org) : undefined }}>
      <Page
        title={`${org?.name || 'Loading'} - Request - Tutorbook`}
        formWidth
        {...props}
      >
        <EmptyHeader formWidth />
        <Request />
      </Page>
    </OrgContext.Provider>
  );
}

interface RequestPageQuery extends ParsedUrlQuery {
  org: string;
}

export const getStaticProps: GetStaticProps<
  RequestPageProps,
  RequestPageQuery
> = async (ctx: GetStaticPropsContext<RequestPageQuery>) => {
  if (!ctx.params) throw new Error('Cannot fetch org w/out params.');
  const [error, org] = await to(getOrg(ctx.params.org));
  if (error || !org) return { notFound: true, revalidate: 1 };
  const { props } = await getPageProps();
  return { props: { org: org.toJSON(), ...props }, revalidate: 1 };
};

export const getStaticPaths: GetStaticPaths<RequestPageQuery> = async () => {
  const paths = (await getOrgs()).map((org) => ({ params: { org: org.id } }));
  return { paths, fallback: true };
};

export default withI18n(RequestPage, { common, user3rd });
