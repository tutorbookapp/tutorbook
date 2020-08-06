import ErrorPage from 'next/error';
import Intercom from 'components/react-intercom';
import Footer from 'components/footer';
import People from 'components/people';

import React, { useMemo, useEffect } from 'react';
import Router, { useRouter } from 'next/router';

import { TabHeader } from 'components/navigation';
import { useUser } from 'lib/account';
import { withI18n } from 'lib/intl';

import useTranslation from 'next-translate/useTranslation';

import common from 'locales/en/common.json';
import people from 'locales/en/people.json';
import query from 'locales/en/query.json';
import user from 'locales/en/user.json';
import appt from 'locales/en/appt.json';

function PeoplePage(): JSX.Element {
  const { orgs, loggedIn } = useUser();
  const { query: params } = useRouter();
  const { t } = useTranslation();

  const org = useMemo(() => {
    const idx = orgs.findIndex((o) => o.id === params.org);
    if (idx < 0) return;
    return orgs[idx];
  }, [orgs, params.org]);

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
                as: `/${params.org as string}/dashboard`,
              },
              {
                label: t('common:people'),
                active: true,
                href: '/[org]/people',
                as: `/${params.org as string}/people`,
              },
              {
                label: t('common:matches'),
                active: false,
                href: '/[org]/matches',
                as: `/${params.org as string}/matches`,
              },
            ]}
          />
          <People org={org} />
          <Footer />
          <Intercom />
        </>
      )}
    </>
  );
}

export default withI18n(PeoplePage, {
  common,
  people,
  query,
  user,
  appt,
});
