import React from 'react';
import ErrorPage from 'next/error';
import Intercom from 'components/react-intercom';
import Footer from 'components/footer';

import { useRouter } from 'next/router';
import { ParsedUrlQuery } from 'querystring';
import { GetServerSideProps, GetServerSidePropsContext } from 'next';
import { Org, OrgJSON, ApptsQuery, ApiError } from 'lib/model';
import { ListApptsRes } from 'lib/api/list-appts';
import { Appts } from 'components/dashboard';
import { TabHeader } from 'components/header';
import {
  db,
  auth,
  FirebaseError,
  DecodedIdToken,
  DocumentSnapshot,
  DocumentReference,
} from 'lib/api/helpers/firebase';
import { withI18n } from 'lib/intl';

import axios, { AxiosError, AxiosResponse } from 'axios';

import to from 'await-to-js';
import useTranslation from 'next-translate/useTranslation';

import common from 'locales/en/common.json';
import appts from 'locales/en/appts.json';

interface ApptsPageProps {
  errorCode?: number;
  errorMessage?: string;
  result?: ListApptsRes;
  org?: OrgJSON;
}

interface ApptsPageQuery extends ParsedUrlQuery {
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
  ApptsPageProps,
  ApptsPageQuery
> = async ({ req, res, params }: GetServerSidePropsContext<ApptsPageQuery>) => {
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
      let props: ApptsPageProps = {};
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
        const query = new ApptsQuery({
          orgs: [{ label: org.name, value: org.id }],
          hitsPerPage: 10,
        });
        const url = `http://${req.headers.host as string}${query.endpoint}`;
        const [error, response] = await to<
          AxiosResponse<ListApptsRes>,
          AxiosError<ApiError>
        >(
          axios.get<ListApptsRes>(url, {
            headers: { authorization: req.headers.authorization },
          })
        );
        if (error && error.response) {
          props = {
            ...props,
            errorCode: error.response.status,
            errorMessage: error.response.data.msg,
          };
        } else if (error && error.request) {
          props = {
            ...props,
            errorCode: 500,
            errorMessage: 'Users API did not respond.',
          };
        } else if (error) {
          props = {
            ...props,
            errorCode: 500,
            errorMessage: `${error.name} fetching users: ${error.message}`,
          };
        } else {
          const { data: result } = response as AxiosResponse<ListApptsRes>;
          props = { ...props, result, org: org.toJSON() };
        }
      }
      return { props };
    }
  }
};

function ApptsPage({
  errorCode,
  errorMessage,
  result,
  org,
}: ApptsPageProps): JSX.Element {
  const { query } = useRouter();
  const { t } = useTranslation();
  if (errorCode || errorMessage)
    return <ErrorPage statusCode={errorCode || 400} title={errorMessage} />;
  return (
    <>
      <TabHeader
        tabs={[
          {
            label: t('common:overview'),
            active: false,
            href: '/[org]/dashboard',
            as: `/${query.org as string}/dashboard`,
          },
          {
            label: t('common:people'),
            active: false,
            href: '/[org]/people',
            as: `/${query.org as string}/people`,
          },
          {
            label: t('common:appts'),
            active: true,
            href: '/[org]/appts',
            as: `/${query.org as string}/appts`,
          },
        ]}
      />
      <Appts
        org={Org.fromJSON(org as OrgJSON)}
        initialData={result as ListApptsRes}
      />
      <Footer />
      <Intercom />
    </>
  );
}

export default withI18n(ApptsPage, { common, appts });
