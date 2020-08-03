import React from 'react';
import ErrorPage from 'next/error';
import Intercom from 'components/react-intercom';
import Footer from 'components/footer';

import { Overview } from 'components/dashboard';
import { TabHeader } from 'components/header';
import { withI18n } from 'lib/intl';
import { useUser } from 'lib/account';

import useTranslation from 'next-translate/useTranslation';

import common from 'locales/en/common.json';
import overview from 'locales/en/overview.json';

function DashboardPage(): JSX.Element {
  const { t } = useTranslation();
  const { user, loggedIn } = useUser();
  return (
    <>
      {loggedIn === false && (
        <ErrorPage
          statusCode={401}
          title='You must be logged in to access this page.'
        />
      )}
      {loggedIn !== false && (
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
      )}
    </>
  );
}

export default withI18n(DashboardPage, { common, overview });
