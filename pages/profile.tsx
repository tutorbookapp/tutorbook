import useTranslation from 'next-translate/useTranslation';

import Page from 'components/page';
import Profile from 'components/profile';
import { TabHeader } from 'components/navigation';

import { usePage } from 'lib/hooks';
import { withI18n } from 'lib/intl';

import common from 'locales/en/common.json';
import profile from 'locales/en/profile.json';
import user3rd from 'locales/en/user3rd.json';

function ProfilePage(): JSX.Element {
  const { t } = useTranslation();

  usePage({ name: 'Profile', url: '/profile', login: true });

  return (
    <Page title='Profile - Tutorbook'>
      <TabHeader
        switcher
        tabs={[
          {
            label: t('common:overview'),
            href: '/dashboard',
          },
          {
            label: t('common:calendar'),
            href: '/calendar',
          },
          {
            label: t('common:profile'),
            active: true,
            href: '/profile',
          },
        ]}
      />
      <Profile />
    </Page>
  );
}

export default withI18n(ProfilePage, { common, profile, user3rd });
