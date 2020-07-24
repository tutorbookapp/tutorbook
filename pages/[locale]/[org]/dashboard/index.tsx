import React from 'react';
import ErrorPage from 'next/error';
import Intercom from 'components/react-intercom';
import Footer from 'components/footer';

import { useRouter } from 'next/router';
import { ParsedUrlQuery } from 'querystring';
import { GetServerSideProps, GetServerSidePropsContext } from 'next';
import { Overview } from 'components/dashboard';
import { TabHeader } from 'components/header';
import { Org, OrgJSON } from 'lib/model';
import {
  db,
  auth,
  FirebaseError,
  DecodedIdToken,
  DocumentSnapshot,
  DocumentReference,
} from 'lib/api/helpers/firebase';
import {
  useIntl,
  getIntlProps,
  withIntl,
  IntlProps,
  IntlShape,
  IntlHelper,
  Msg,
} from 'lib/intl';

import to from 'await-to-js';
import msgs from 'components/dashboard/msgs';

interface DashboardPageProps {
  org?: OrgJSON;
  errorCode?: number;
  errorMessage?: string;
}

interface DashboardPageQuery extends ParsedUrlQuery {
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
  DashboardPageProps & IntlProps,
  DashboardPageQuery
> = async ({
  req,
  res,
  params,
}: GetServerSidePropsContext<DashboardPageQuery>) => {
  if (!params) {
    throw new Error('We must have query parameters while rendering.');
  } else if (!req.headers.authorization) {
    res.statusCode = 302;
    res.setHeader('Location', `/${params.locale}/login`);
    res.end();
    throw new Error('You must be logged in to access this page.');
  } else {
    const [err, token] = await to<DecodedIdToken, FirebaseError>(
      auth.verifyIdToken(req.headers.authorization.replace('Bearer ', ''))
    );
    if (err) {
      res.statusCode = 302;
      res.setHeader('Location', `/${params.locale}/login`);
      res.end();
      throw new Error(`${err.name} verifying JWT: ${err.message}`);
    } else {
      const { uid } = token as DecodedIdToken;
      const ref: DocumentReference = db.collection('orgs').doc(params.org);
      const doc: DocumentSnapshot = await ref.get();
      const org: Org = Org.fromFirestore(doc);
      let props: DashboardPageProps & IntlProps = await getIntlProps({
        params,
      });
      if (!doc.exists) {
        props = {
          ...props,
          errorCode: 404,
          errorMessage: 'Organization does not exist',
        };
      } else if (org.members.indexOf(uid) < 0) {
        props = {
          ...props,
          errorCode: 401,
          errorMessage: 'You are not a member of this organization',
        };
      } else {
        props = { ...props, org: org.toJSON() };
      }
      return { props };
    }
  }
};

function DashboardPage({
  errorCode,
  errorMessage,
  org,
}: DashboardPageProps): JSX.Element {
  const { query } = useRouter();
  const intl: IntlShape = useIntl();
  const msg: IntlHelper = (message: Msg) => intl.formatMessage(message);
  if (errorCode || errorMessage)
    return <ErrorPage statusCode={errorCode || 400} title={errorMessage} />;
  return (
    <>
      <TabHeader
        tabs={[
          {
            label: msg(msgs.overview),
            active: true,
            href: '/[org]/dashboard',
            as: `/${query.org as string}/dashboard`,
          },
          {
            label: msg(msgs.people),
            active: false,
            href: '/[org]/dashboard/people',
            as: `/${query.org as string}/dashboard/people`,
          },
          {
            label: msg(msgs.appts),
            active: false,
            href: '/[org]/dashboard/appts',
            as: `/${query.org as string}/dashboard/appts`,
          },
        ]}
      />
      <Overview account={Org.fromJSON(org as OrgJSON)} />
      <Footer />
      <Intercom />
    </>
  );
}

export default withIntl(DashboardPage);
