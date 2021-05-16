import { ParsedUrlQuery } from 'querystring';

import { GetStaticPaths, GetStaticProps, GetStaticPropsContext } from 'next';
import Router, { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import useTranslation from 'next-translate/useTranslation';

import { AspectHeader, EmptyHeader } from 'components/navigation';
import Page from 'components/page';
import Signup from 'components/signup';

import { Aspect, isAspect } from 'lib/model/aspect';
import { Org, OrgJSON } from 'lib/model/org';
import { PageProps, getPageProps } from 'lib/page';
import { OrgContext } from 'lib/context/org';
import { db } from 'lib/api/firebase';
import usePage from 'lib/hooks/page';
import { useUser } from 'lib/context/user';
import { withI18n } from 'lib/intl';

import common from 'locales/en/common.json';
import signup from 'locales/en/signup.json';
import user3rd from 'locales/en/user3rd.json';

interface SignupPageProps extends PageProps {
  org?: OrgJSON;
}

function SignupPage({ org, ...props }: SignupPageProps): JSX.Element {
  const { query } = useRouter();
  const { lang: locale } = useTranslation();
  const [aspect, setAspect] = useState<Aspect>(() => {
    if (!org) return 'mentoring';
    return org.aspects[0] || 'mentoring';
  });

  usePage({ name: 'Org Signup', org: org?.id });
  useEffect(() => {
    setAspect((prev: Aspect) => {
      const updated = isAspect(query.aspect) ? query.aspect : prev;
      if (org && !org.aspects.includes(updated)) return prev;
      return updated;
    });
  }, [org, query]);

  // Redirect to the user's profile page if they're logged in. Temporary fix for
  // the revalidation problem that would clear any edits on this signup page.
  // @see {@link https://github.com/tutorbookapp/tutorbook/issues/181}
  const { loggedIn } = useUser();
  useEffect(() => {
    void Router.prefetch('/profile');
  }, []);
  useEffect(() => {
    if (!loggedIn) return;
    void Router.replace('/profile');
  }, [loggedIn]);

  return (
    <OrgContext.Provider value={{ org: org ? Org.fromJSON(org) : undefined }}>
      <Page
        title={`${org?.name || 'Loading'} - Signup - Tutorbook`}
        description={org ? org.signup[locale][aspect]?.body : undefined}
        formWidth
        {...props}
      >
        {(!org || org.aspects.length === 2) && (
          <AspectHeader aspect={aspect} onChange={setAspect} formWidth />
        )}
        {!!org && org.aspects.length !== 2 && <EmptyHeader formWidth />}
        <Signup aspect={aspect} />
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
  const doc = await db.collection('orgs').doc(ctx.params.org).get();
  if (!doc.exists) return { notFound: true };
  const org = Org.fromFirestoreDoc(doc);
  const { props } = await getPageProps();
  return { props: { org: org.toJSON(), ...props }, revalidate: 1 };
};

export const getStaticPaths: GetStaticPaths<SignupPageQuery> = async () => {
  const orgs = (await db.collection('orgs').get()).docs;
  const paths = orgs.map((org) => ({ params: { org: org.id } }));
  return { paths, fallback: true };
};

export default withI18n(SignupPage, { common, signup, user3rd });
