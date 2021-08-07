import useTranslation from 'next-translate/useTranslation';

import Overview from 'components/overview';
import Page from 'components/page';
import { TabHeader } from 'components/navigation';

import { PageProps, getPageProps } from 'lib/page';
import usePage from 'lib/hooks/page';
import { withI18n } from 'lib/intl';

import common from 'locales/en/common.json';
import overview from 'locales/en/overview.json';

function OverviewPage(props: PageProps): JSX.Element {
  const { t } = useTranslation();

  usePage({ name: 'Overview', url: '/overview', login: true });

  return (
    <Page title='Overview - Tutorbook' intercom {...props}>
      <TabHeader
        switcher
        tabs={[
          {
            active: true,
            label: t('common:overview'),
            href: '/overview',
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

export const getStaticProps = getPageProps;

export default withI18n(OverviewPage, { common, overview });
