import useTranslation from 'next-translate/useTranslation';

import Overview from 'components/overview';
import Page from 'components/page';
import { TabHeader } from 'components/navigation';

import { usePage } from 'lib/hooks';
import { withI18n } from 'lib/intl';

import common from 'locales/en/common.json';
import overview from 'locales/en/overview.json';

function DashboardPage(): JSX.Element {
  const { t } = useTranslation();

  usePage({ name: 'Dashboard', url: '/dashboard', login: true });

  return (
    <Page title='Dashboard - Tutorbook' intercom>
      <TabHeader
        switcher
        tabs={[
          {
            active: true,
            label: t('common:overview'),
            href: '/dashboard',
          },
          {
            label: t('common:matches'),
            href: '/matches',
          },
          {
            label: t('common:calendar'),
            href: '/calendar',
          },
          {
            label: t('common:profile'),
            href: '/profile',
          },
        ]}
      />
      <Overview />
    </Page>
  );
}

export default withI18n(DashboardPage, { common, overview });
