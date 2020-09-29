import useTranslation from 'next-translate/useTranslation';

import Page from 'components/page';
import Profile from 'components/profile';
import { TabHeader } from 'components/navigation';

import { useLoggedIn } from 'lib/hooks';
import { withI18n } from 'lib/intl';

import common from 'locales/en/common.json';
import profile from 'locales/en/profile.json';
import user3rd from 'locales/en/user3rd.json';

function ProfilePage(): JSX.Element {
  const { t } = useTranslation();

  useLoggedIn('profile');

  return (
    <Page>
      <TabHeader
        links
        tabs={[
          {
            label: t('common:overview'),
            active: false,
            href: '/dashboard',
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
