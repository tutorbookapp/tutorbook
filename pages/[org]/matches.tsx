import ErrorPage from 'next/error';
import { useEffect, useMemo } from 'react';
import Router, { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';

import Intercom from 'components/react-intercom';
import Footer from 'components/footer';
import Matches from 'components/matches';
import { TabHeader } from 'components/navigation';

import { useUser } from 'lib/account';
import { withI18n } from 'lib/intl';

import match from 'locales/en/match.json';
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

  useEffect(() => {
    if (loggedIn === false) {
      void Router.push('/login');
    }
  }, [loggedIn]);

  return (
    <>
      {!!loggedIn && !org && (
        <ErrorPage statusCode={401} title={t('common:not-org-member')} />
      )}
      {!!org && (
        <>
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
            ]}
          />
          <Matches org={org} />
          <Footer />
          <Intercom />
        </>
      )}
    </>
  );
}

export default withI18n(MatchesPage, { common, matches, match });
