import React from 'react';
import Intercom from 'components/react-intercom';
import Footer from 'components/footer';

import useTranslation from 'next-translate/useTranslation';

import { ParsedUrlQuery } from 'querystring';
import { GetServerSideProps, GetServerSidePropsContext } from 'next';
import { getIntlProps, withIntl, IntlProps } from 'lib/intl';
import { useUser } from 'lib/account';
import { Overview } from 'components/dashboard';
import { TabHeader } from 'components/header';

interface DashboardPageQuery extends ParsedUrlQuery {
  locale: string;
}

export const getServerSideProps: GetServerSideProps<
  IntlProps,
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
    return { props: await getIntlProps({ params }, ['common', 'overview']) };
  }
};

function DashboardPage(): JSX.Element {
  const { t } = useTranslation();
  const { user } = useUser();
  return (
    <>
      <TabHeader
        tabs={[
          {
            label: t('common:overview'),
            active: true,
            href: '/dashboard',
          },
        ]}
      />
      <Overview account={user} />
      <Footer />
      <Intercom />
    </>
  );
}

export default withIntl(DashboardPage);
