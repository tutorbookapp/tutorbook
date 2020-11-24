import ErrorPage from 'next/error';
import { useMemo } from 'react';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';

import { TabHeader } from 'components/navigation';
import Users from 'components/users';
import Page from 'components/page';

import { useLoggedIn, usePage } from 'lib/hooks';
import { OrgContext } from 'lib/context/org';
import { useUser } from 'lib/context/user';
import { withI18n } from 'lib/intl';

import common from 'locales/en/common.json';
import users from 'locales/en/users.json';
import search from 'locales/en/search.json';
import query from 'locales/en/query.json';
import user from 'locales/en/user.json';
import match from 'locales/en/match.json';
import request from 'locales/en/request.json';

function UsersPage(): JSX.Element {
  const { orgs, loggedIn } = useUser();
  const { query: params } = useRouter();
  const { t } = useTranslation();

  const org = useMemo(() => {
    const idx = orgs.findIndex((o) => o.id === params.org);
    if (idx < 0) return;
    return orgs[idx];
  }, [orgs, params.org]);

  usePage('Org Users', params.org as string);
  useLoggedIn(`/${params.org as string}/users`);

  return (
    <OrgContext.Provider value={{ org }}>
      {!!loggedIn && !org && (
        <ErrorPage statusCode={401} title={t('common:not-org-member')} />
      )}
      {!!org && (
        <Page title={`${org.name} - Users - Tutorbook`}>
          <TabHeader
            switcher
            tabs={[
              {
                label: t('common:overview'),
                href: `/${params.org as string}/dashboard`,
              },
              {
                label: t('common:users'),
                active: true,
                href: `/${params.org as string}/users`,
              },
              {
                label: t('common:matches'),
                href: `/${params.org as string}/matches`,
              },
              {
                label: t('common:settings'),
                href: `/${params.org as string}/settings`,
              },
            ]}
          />
          <Users org={org} />
        </Page>
      )}
    </OrgContext.Provider>
  );
}

export default withI18n(UsersPage, {
  common,
  users,
  search,
  query,
  user,
  match,
  request,
});
