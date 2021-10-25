import useTranslation from 'next-translate/useTranslation';

import Page from 'components/page';
import Profile from 'components/profile';
import { TabHeader } from 'components/navigation';

import { PageProps, getPageProps } from 'lib/page';
import usePage from 'lib/hooks/page';
import { withI18n } from 'lib/intl';

import common from 'locales/en/common.json';
import profile from 'locales/en/profile.json';
import user3rd from 'locales/en/user3rd.json';

function ProfilePage(props: PageProps): JSX.Element {
  const { t } = useTranslation();

  usePage('Profile', { login: true });

  return (
    <Page title='Profile - Tutorbook' {...props}>
      <TabHeader
        switcher
        tabs={[
          {
            label: t('common:overview'),
            href: '/overview',
          },
          {
            label: t('common:calendar'),
            href: '/calendar',
          },
          {
            active: true,
            label: t('common:profile'),
            href: '/profile',
          },
        ]}
      />
      <Profile />
    </Page>
  );
}

export const getStaticProps = getPageProps;

export default withI18n(ProfilePage, { common, profile, user3rd });
