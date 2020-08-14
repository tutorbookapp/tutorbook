import { useEffect } from 'react';
import Router from 'next/router';
import useTranslation from 'next-translate/useTranslation';
import common from 'locales/en/common.json';
import overview from 'locales/en/overview.json';

import Intercom from 'components/react-intercom';
import Footer from 'components/footer';
import Overview from 'components/overview';
import { TabHeader } from 'components/navigation';

import { withI18n } from 'lib/intl';
import { useUser } from 'lib/account';

function DashboardPage(): JSX.Element {
  const { t } = useTranslation();
  const { user, loggedIn } = useUser();

  useEffect(() => {
    if (loggedIn === false) {
      void Router.push('/login');
    }
  }, [loggedIn]);

  return (
    <>
      <TabHeader
        links
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

export default withI18n(DashboardPage, { common, overview });
