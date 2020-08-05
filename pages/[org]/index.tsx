import React from 'react';
import ErrorPage from 'next/error';
import Intercom from 'components/react-intercom';
import OrgDisplay from 'components/org-display';
import Footer from 'components/footer';

import { withI18n } from 'lib/intl';
import { ParsedUrlQuery } from 'querystring';
import { GetServerSideProps, GetServerSidePropsContext } from 'next';
import { LinkHeader } from 'components/navigation';
import { Org, OrgJSON } from 'lib/model';
import {
  db,
  DocumentSnapshot,
  DocumentReference,
} from 'lib/api/helpers/firebase';

import common from 'locales/en/common.json';
import signup from 'locales/en/signup.json';
import query from 'locales/en/query.json';
import org from 'locales/en/org.json';

interface OrgPageProps {
  org?: OrgJSON;
  errorCode?: number;
  errorMessage?: string;
}

interface OrgPageQuery extends ParsedUrlQuery {
  locale: string;
  org: string;
}

/**
 * Ideally, we'd use Next.js's automatic static optimization to pre-render a
 * skeleton screen and then grab the user-specific data using SWR once Next.js
 * hydrates the page client-side (with the `org` query).
 *
 * But, we can't do this right now due to the way our localization is setup.
 * We can't use `getStaticPaths` for a subset of the dynamic paths (i.e. we have
 * to provide both the `org` and the `locale` paths). So we'd be forced to
 * render a skeleton screen in the default locale and then manually fetch the
 * needed translations client-side once Next.js hydrates the page (and we know
 * the `locale` query).
 *
 * To get around this, we SSR the dashboard page only if the user is logged in
 * (and thus has a SW that intercepted this request and appended a JWT to it).
 * If a user isn't logged in, we redirect the user to the login page.
 *
 * @see {@link https://github.com/vinissimus/next-translate/issues/129}
 * @see {@link https://github.com/vercel/next.js/issues/14200}
 */
export const getServerSideProps: GetServerSideProps<
  OrgPageProps,
  OrgPageQuery
> = async ({ req, res, params }: GetServerSidePropsContext<OrgPageQuery>) => {
  if (!params) {
    throw new Error('We must have query parameters while rendering.');
  } else {
    const ref: DocumentReference = db.collection('orgs').doc(params.org);
    const doc: DocumentSnapshot = await ref.get();
    const org: Org = Org.fromFirestore(doc);
    let props: OrgPageProps = {};
    if (!doc.exists) {
      props = {
        ...props,
        errorCode: 404,
        errorMessage: 'Organization does not exist',
      };
    } else {
      props = { ...props, org: org.toJSON() };
    }
    return { props };
  }
};

function OrgPage({ errorCode, errorMessage, org }: OrgPageProps): JSX.Element {
  if (errorCode || errorMessage)
    return <ErrorPage statusCode={errorCode || 400} title={errorMessage} />;
  return (
    <>
      <LinkHeader />
      <OrgDisplay org={Org.fromJSON(org as OrgJSON)} />
      <Footer />
      <Intercom />
    </>
  );
}

export default withI18n(OrgPage, { common, query, signup, org });
