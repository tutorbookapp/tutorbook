import { ParsedUrlQuery } from 'querystring';

import { GetStaticPaths, GetStaticProps, GetStaticPropsContext } from 'next';
import to from 'await-to-js';
import useTranslation from 'next-translate/useTranslation';

import { EmptyHeader } from 'components/navigation';
import Page from 'components/page';
import Signup from 'components/signup';

import { Org, OrgJSON } from 'lib/model/org';
import { PageProps, getPageProps } from 'lib/page';
import { getOrg, getOrgs } from 'lib/api/db/org';
import { OrgContext } from 'lib/context/org';
import usePage from 'lib/hooks/page';
import { withI18n } from 'lib/intl';

import common from 'locales/en/common.json';
import user3rd from 'locales/en/user3rd.json';

interface SignupPageProps extends PageProps {
  org?: OrgJSON;
}

function SignupPage({ org, ...props }: SignupPageProps): JSX.Element {
  const { lang: locale } = useTranslation();

  usePage({ name: 'Org Signup', org: org?.id });

  return (
    <OrgContext.Provider value={{ org: org ? Org.fromJSON(org) : undefined }}>
      <Page
        title={`${org?.name || 'Loading'} - Signup - Tutorbook`}
        description={org ? org.signup[locale]?.body : undefined}
        formWidth
        {...props}
      >
        <EmptyHeader formWidth />
        <Signup />
      </Page>
    </OrgContext.Provider>
  );
}

interface SignupPageQuery extends ParsedUrlQuery {
  org: string;
}

export const getStaticProps: GetStaticProps<
  SignupPageProps,
  SignupPageQuery
> = async (ctx: GetStaticPropsContext<SignupPageQuery>) => {
  if (!ctx.params) throw new Error('Cannot fetch org w/out params.');
  const [error, org] = await to(getOrg(ctx.params.org));
  if (error || !org) return { notFound: true };
  const { props } = await getPageProps();
  return { props: { org: org.toJSON(), ...props }, revalidate: 1 };
};

export const getStaticPaths: GetStaticPaths<SignupPageQuery> = async () => {
  const paths = (await getOrgs()).map((org) => ({ params: { org: org.id } }));
  return { paths, fallback: true };
};

export default withI18n(SignupPage, { common, user3rd });
