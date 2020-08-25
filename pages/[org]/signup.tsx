import { GetStaticPaths, GetStaticProps, GetStaticPropsContext } from 'next';
import { useState } from 'react';

import { AspectHeader, EmptyHeader } from 'components/navigation';
import Intercom from 'components/react-intercom';
import Footer from 'components/footer';
import Signup from 'components/signup';

import { withI18n } from 'lib/intl';
import { Aspect, Org, OrgJSON } from 'lib/model';
import { db } from 'lib/api/helpers/firebase';

import user3rd from 'locales/en/user3rd.json';
import signup from 'locales/en/signup.json';
import common from 'locales/en/common.json';

interface SignupPageProps {
  org: OrgJSON;
}

/**
 * A basic org-specific signup page (meant to replace a Google Form or Typeform)
 * that includes:
 * - The org's name, photo, bio, and contact information.
 * - A brief "How it works" message from the org.
 * - The generic floating sign-up form that creates a new account within the
 * given org.
 */
function SignupPage({ org }: SignupPageProps): JSX.Element {
  const [aspect, setAspect] = useState<Aspect>(org.aspects[0] || 'tutoring');
  return (
    <>
      {org.aspects.length === 2 && (
        <AspectHeader aspect={aspect} onChange={setAspect} formWidth />
      )}
      {org.aspects.length !== 2 && <EmptyHeader formWidth />}
      <Signup aspect={aspect} org={org} />
      <Footer formWidth />
      <Intercom />
    </>
  );
}

interface SignupPageQuery extends ParsedUrlQuery {
  org: string;
}

export const getStaticProps: GetStaticProps<
  SignupPageProps,
  SignupPageQuery
> = async (ctx: GetStaticPropsContext<SignupPageQuery>) => {
  const doc = await db.collection('orgs').doc(ctx.params.org).get();
  if (!doc.exists) throw new Error(`Org (${doc.id}) doesn't exist.`);
  const org = Org.fromFirestore(doc);
  return { props: { org: org.toJSON() } };
};

export const getStaticPaths: GetStaticPaths<SignupPageQuery> = async () => {
  const orgs = (await db.collection('orgs').get()).docs;
  const paths = orgs.map((org) => ({ params: { org: org.id } }));
  return { paths, fallback: false };
};

export default withI18n(SignupPage, { common, signup, user3rd });
