import ErrorPage from 'next/error';
import Intercom from 'components/react-intercom';
import Footer from 'components/footer';
import Overview from 'components/overview';

import React, { useMemo, useEffect } from 'react';
import Router, { useRouter } from 'next/router';

import { TabHeader } from 'components/navigation';
import { useUser } from 'lib/account';
import { withI18n } from 'lib/intl';

import useTranslation from 'next-translate/useTranslation';

import common from 'locales/en/common.json';
import overview from 'locales/en/overview.json';

function DashboardPage(): JSX.Element {
  const { orgs, loggedIn } = useUser();
  const { query } = useRouter();
  const { t } = useTranslation();

  const org = useMemo(() => {
    const idx = orgs.findIndex((o) => o.id === query.org);
    if (idx < 0) return;
    return orgs[idx];
  }, [orgs, query.org]);

  useEffect(() => {
    if (loggedIn === false) {
      void Router.push('/login');
    }
  }, [loggedIn]);

  return (
    <>
      {!!loggedIn && !org && (
        <ErrorPage statusCode={401} title={t('common:not-org-member')} />
      )}
      {!!org && (
        <>
          <TabHeader
            tabs={[
              {
                label: t('common:overview'),
                active: true,
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
                label: t('common:matches'),
                active: false,
                href: '/[org]/matches',
                as: `/${query.org as string}/matches`,
              },
            ]}
          />
          <Overview account={org} />
          <Footer />
          <Intercom />
        </>
      )}
    </>
  );
}

export default withI18n(DashboardPage, { common, overview });
