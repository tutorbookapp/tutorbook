import ErrorPage from 'next/error';
import { useMemo } from 'react';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';

import Overview from 'components/overview';
import Page from 'components/page';
import { TabHeader } from 'components/navigation';

import { useLoggedIn, usePage } from 'lib/hooks';
import { OrgContext } from 'lib/context/org';
import { useUser } from 'lib/context/user';
import { withI18n } from 'lib/intl';

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

  usePage('Org Dashboard', query.org as string);
  useLoggedIn(`/${query.org as string}/dashboard`);

  return (
    <OrgContext.Provider value={{ org }}>
      {!!loggedIn && !org && (
        <ErrorPage statusCode={401} title={t('common:not-org-member')} />
      )}
      {!!org && (
        <Page title={`${org.name} - Dashboard - Tutorbook`} intercom>
          <TabHeader
            switcher
            tabs={[
              {
                label: t('common:overview'),
                active: true,
                href: `/${query.org as string}/dashboard`,
              },
              {
                label: t('common:users'),
                href: `/${query.org as string}/users`,
              },
              {
                label: t('common:matches'),
                href: `/${query.org as string}/matches`,
              },
              {
                label: t('common:settings'),
                href: `/${query.org as string}/settings`,
              },
            ]}
          />
          <Overview account={org} />
        </Page>
      )}
    </OrgContext.Provider>
  );
}

export default withI18n(DashboardPage, { common, overview });
