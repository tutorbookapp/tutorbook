import ErrorPage from 'next/error';
import { useEffect, useMemo } from 'react';
import Router, { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';

import Page from 'components/page';
import Overview from 'components/overview';
import { TabHeader } from 'components/navigation';

import { useUser } from 'lib/account';
import { withI18n } from 'lib/intl';

import overview from 'locales/en/overview.json';
import common from 'locales/en/common.json';

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
        <Page>
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
              {
                label: t('common:settings'),
                active: false,
                href: '/[org]/settings',
                as: `/${query.org as string}/settings`,
              },
            ]}
          />
          <Overview account={org} />
        </Page>
      )}
    </>
  );
}

export default withI18n(DashboardPage, { common, overview });
