import useTranslation from 'next-translate/useTranslation';

import Page from 'components/page';
import Overview from 'components/overview';
import { TabHeader } from 'components/navigation';

import { usePage } from 'lib/hooks';
import { withI18n } from 'lib/intl';

import overview from 'locales/en/overview.json';
import common from 'locales/en/common.json';

function DashboardPage(): JSX.Element {
  const { t } = useTranslation();

  usePage({ name: 'Dashboard', url: '/dashboard', login: true });

  return (
    <Page title='Dashboard - Tutorbook' intercom>
      <TabHeader
        switcher
        tabs={[
          {
            label: t('common:overview'),
            active: true,
            href: '/dashboard',
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
