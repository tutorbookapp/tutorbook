import useTranslation from 'next-translate/useTranslation';

import Page from 'components/page';
import Overview from 'components/overview';
import { TabHeader } from 'components/navigation';

import { useLoggedIn } from 'lib/hooks';
import { useUser } from 'lib/context/user';
import { withI18n } from 'lib/intl';

import overview from 'locales/en/overview.json';
import common from 'locales/en/common.json';

function DashboardPage(): JSX.Element {
  const { t } = useTranslation();
  const { user } = useUser();

  useLoggedIn('dashboard');

  return (
    <Page title='Dashboard - Tutorbook'>
      <TabHeader
        tabs={[
          {
            label: t('common:overview'),
            active: true,
            href: '/dashboard',
          },
          {
            label: t('common:profile'),
            active: false,
            href: '/profile',
          },
        ]}
      />
      <Overview account={user} />
    </Page>
  );
}

export default withI18n(DashboardPage, { common, overview });
