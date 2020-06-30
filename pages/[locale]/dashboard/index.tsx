import React from 'react';

import { GetServerSideProps, GetServerSidePropsContext } from 'next';
import {
  useMsg,
  getIntlProps,
  withIntl,
  IntlHelper,
  IntlProps,
} from 'lib/intl';
import { useUser } from 'lib/account';
import { Overview } from 'components/dashboard';
import { TabHeader } from 'components/header';

import Intercom from 'components/react-intercom';
import Footer from 'components/footer';

import tabs from 'components/dashboard/msgs';

interface DashboardPageQuery {
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
  if (!req.headers.authorization) {
    res.statusCode = 302;
    res.setHeader('Location', `/${params.locale}/login`);
    res.end();
    throw new Error('You must be logged in to access this page.');
  } else {
    return { props: await getIntlProps({ params }) };
  }
};

function DashboardPage(): JSX.Element {
  const msg: IntlHelper = useMsg();
  const { user } = useUser();
  return (
    <>
      <TabHeader
        tabs={[
          {
            label: msg(tabs.overview),
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
