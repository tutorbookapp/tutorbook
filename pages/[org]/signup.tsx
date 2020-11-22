import { ParsedUrlQuery } from 'querystring';

import { GetStaticPaths, GetStaticProps, GetStaticPropsContext } from 'next';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

import { AspectHeader, EmptyHeader } from 'components/navigation';
import Signup from 'components/signup';
import Page from 'components/page';

import { isAspect, Aspect, Org, OrgJSON } from 'lib/model';
import { OrgContext } from 'lib/context/org';
import { db } from 'lib/api/firebase';
import { usePage } from 'lib/hooks';
import { withI18n } from 'lib/intl';

import user3rd from 'locales/en/user3rd.json';
import signup from 'locales/en/signup.json';
import common from 'locales/en/common.json';

interface SignupPageProps {
  org?: OrgJSON;
}

function SignupPage({ org }: SignupPageProps): JSX.Element {
  const { query } = useRouter();
  const [aspect, setAspect] = useState<Aspect>(() => {
    if (!org) return 'mentoring';
    return org.aspects[0] || 'mentoring';
  });

  usePage('Org Signup');
  useEffect(() => {
    setAspect((prev: Aspect) => {
      const updated = isAspect(query.aspect) ? query.aspect : prev;
      if (org && !org.aspects.includes(updated)) return prev;
      return updated;
    });
  }, [org, query]);

  return (
    <OrgContext.Provider value={{ org: org ? Org.fromJSON(org) : undefined }}>
      <Page title={`${org?.name || 'Loading'} - Signup - Tutorbook`} formWidth>
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
  if (!doc.exists) throw new Error(`Org (${doc.id}) doesn't exist.`);
  const org = Org.fromFirestore(doc);
  return { props: { org: org.toJSON() }, revalidate: 1 };
};

export const getStaticPaths: GetStaticPaths<SignupPageQuery> = async () => {
  const orgs = (await db.collection('orgs').get()).docs;
  const paths = orgs.map((org) => ({ params: { org: org.id } }));
  return { paths, fallback: true };
};

export default withI18n(SignupPage, { common, signup, user3rd });
