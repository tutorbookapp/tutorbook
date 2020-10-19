import { ParsedUrlQuery } from 'querystring';

import { GetStaticPaths, GetStaticProps, GetStaticPropsContext } from 'next';

import { EmptyHeader } from 'components/navigation';
import Home from 'components/home';
import Page from 'components/page';

import { Org, OrgJSON } from 'lib/model';
import { OrgContext } from 'lib/context/org';
import { withI18n } from 'lib/intl';
import { db } from 'lib/api/firebase';

import home from 'locales/en/home.json';
import common from 'locales/en/common.json';

interface HomePageProps {
  org?: OrgJSON;
}

function HomePage({ org }: HomePageProps): JSX.Element {
  return (
    <OrgContext.Provider value={{ org: org ? Org.fromJSON(org) : undefined }}>
      <Page title={`${org?.name || 'Loading'} - Tutorbook`} formWidth>
        <EmptyHeader formWidth />
        <Home org={org} />
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
  const doc = await db.collection('orgs').doc(ctx.params.org).get();
  if (!doc.exists) throw new Error(`Org (${doc.id}) doesn't exist.`);
  const org = Org.fromFirestore(doc);
  return { props: { org: org.toJSON() }, revalidate: 1 };
};

export const getStaticPaths: GetStaticPaths<HomePageQuery> = async () => {
  const orgs = (await db.collection('orgs').get()).docs;
  const paths = orgs.map((org) => ({ params: { org: org.id } }));
  return { paths, fallback: true };
};

export default withI18n(HomePage, { common, home });
