import useTranslation from 'next-translate/useTranslation';

import Matches from 'components/matches';
import Page from 'components/page';
import { TabHeader } from 'components/navigation';

import { PageProps, getPageProps } from 'lib/page';
import { usePage } from 'lib/hooks';
import { withI18n } from 'lib/intl';

import common from 'locales/en/common.json';
import match from 'locales/en/match.json';
import matches from 'locales/en/matches.json';

function MatchesPage(props: PageProps): JSX.Element {
  const { t } = useTranslation();

  usePage({ name: 'Matches', url: '/matches', login: true });

  return (
    <Page title='Matches - Tutorbook' {...props}>
      <TabHeader
        switcher
        tabs={[
          {
            label: t('common:overview'),
            href: '/overview',
          },
          {
            active: true,
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
      <Matches user />
    </Page>
  );
}

export const getStaticProps = getPageProps;

export default withI18n(MatchesPage, { common, match, matches });
