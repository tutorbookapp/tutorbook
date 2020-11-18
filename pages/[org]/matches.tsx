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

import common from 'locales/en/common.json';
import match from 'locales/en/match.json';
import matches from 'locales/en/matches.json';
import user from 'locales/en/user.json';

function MatchesPage(): JSX.Element {
  const { orgs, loggedIn } = useUser();
  const { query } = useRouter();
  const { t } = useTranslation();

  const org = useMemo(() => {
    const idx = orgs.findIndex((o) => o.id === query.org);
    if (idx < 0) return;
    return orgs[idx];
  }, [orgs, query.org]);

  useLoggedIn(`/${query.org as string}/matches`);

  return (
    <OrgContext.Provider value={{ org }}>
      {!!loggedIn && !org && (
        <ErrorPage statusCode={401} title={t('common:not-org-member')} />
      )}
      {!!org && (
        <Page title={`${org.name} - Matches - Tutorbook`}>
          <TabHeader
            switcher
            tabs={[
              {
                label: t('common:overview'),
                href: `/${query.org as string}/dashboard`,
              },
              {
                label: t('common:people'),
                href: `/${query.org as string}/people`,
              },
              {
                label: t('common:matches'),
                active: true,
                href: `/${query.org as string}/matches`,
              },
              {
                label: t('common:settings'),
                href: `/${query.org as string}/settings`,
              },
            ]}
          />
          <Matches org={org} />
        </Page>
      )}
    </OrgContext.Provider>
  );
}

export default withI18n(MatchesPage, { common, match, matches, user });
