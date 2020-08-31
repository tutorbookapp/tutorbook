import ErrorPage from 'next/error';
import { useEffect } from 'react';
import Router, { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';

import Page from 'components/page';
import Settings from 'components/settings';
import Home from 'components/settings/home';
import { TabHeader } from 'components/navigation';

import { useUser } from 'lib/account';
import { withI18n } from 'lib/intl';

import org from 'locales/en/org.json';
import settings from 'locales/en/settings.json';
import common from 'locales/en/common.json';

function HomeSettingsPage(): JSX.Element {
  const { loggedIn } = useUser();
  const { query } = useRouter();
  const { t } = useTranslation();

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
                label: t('common:matches'),
                active: false,
                href: '/[org]/matches',
                as: `/${query.org as string}/matches`,
              },
              {
                label: t('common:settings'),
                active: true,
                href: '/[org]/settings',
                as: `/${query.org as string}/settings`,
              },
            ]}
          />
          <Settings active='home' orgId={query.org as string}>
            <Home />
          </Settings>
        </Page>
      )}
    </>
  );
}

export default withI18n(HomeSettingsPage, { common, settings, org });
