import ErrorPage from 'next/error';
import { useMemo } from 'react';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';

import Page from 'components/page';
import Matches from 'components/matches';
import { TabHeader } from 'components/navigation';

import { OrgContext } from 'lib/context/org';
import { useLoggedIn } from 'lib/hooks';
import { useUser } from 'lib/context/user';
import { withI18n } from 'lib/intl';

import matches from 'locales/en/matches.json';
import common from 'locales/en/common.json';

function MatchesPage(): JSX.Element {
  const { orgs, loggedIn } = useUser();
  const { query } = useRouter();
  const { t } = useTranslation();

  const org = useMemo(() => {
    const idx = orgs.findIndex((o) => o.id === query.org);
    if (idx < 0) return;
    return orgs[idx];
  }, [orgs, query.org]);

  useLoggedIn('/[org]/matches', `/${query.org as string}/matches`);

  return (
    <OrgContext.Provider value={{ org }}>
      {!!loggedIn && !org && (
        <ErrorPage statusCode={401} title={t('common:not-org-member')} />
      )}
      {!!org && (
        <Page title={`${org.name} - Matches - Tutorbook`}>
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
                active: true,
                href: '/[org]/matches',
                as: `/${query.org as string}/matches`,
              },
              {
                label: t('common:settings'),
                active: false,
                href: '/[org]/settings',
                as: `/${query.org as string}/settings`,
              },
            ]}
          />
          <Matches org={org} />
        </Page>
      )}
    </OrgContext.Provider>
  );
}

export default withI18n(MatchesPage, { common, matches });
