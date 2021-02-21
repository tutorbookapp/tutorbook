import { useMemo } from 'react';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';

import Page from 'components/page';
import { TabHeader } from 'components/navigation';
import Users from 'components/users';

import { OrgContext } from 'lib/context/org';
import { usePage } from 'lib/hooks';
import { useUser } from 'lib/context/user';
import { withI18n } from 'lib/intl';

import common from 'locales/en/common.json';
import match from 'locales/en/match.json';
import query from 'locales/en/query.json';
import user from 'locales/en/user.json';
import users from 'locales/en/users.json';
import request from 'locales/en/request.json';
import search from 'locales/en/search.json';

function UsersPage(): JSX.Element {
  const { orgs } = useUser();
  const { query: params } = useRouter();
  const { t } = useTranslation();

  const org = useMemo(() => {
    const idx = orgs.findIndex((o) => o.id === params.org);
    if (idx < 0) return;
    return orgs[idx];
  }, [orgs, params.org]);

  usePage({
    name: 'Org Users',
    url: `/${params.org as string}/users`,
    org: params.org as string,
    login: true,
    admin: true,
  });

  return (
    <OrgContext.Provider value={{ org }}>
      <Page title={`${org?.name || 'Loading'} - Users - Tutorbook`}>
        <TabHeader
          switcher
          tabs={[
            {
              label: t('common:overview'),
              href: `/${params.org as string}/overview`,
            },
            {
              active: true,
              label: t('common:users'),
              href: `/${params.org as string}/users`,
            },
            {
              label: t('common:matches'),
              href: `/${params.org as string}/matches`,
            },
            {
              label: t('common:calendar'),
              href: `/${params.org as string}/calendar`,
            },
            {
              label: t('common:settings'),
              href: `/${params.org as string}/settings`,
            },
          ]}
        />
        <Users />
      </Page>
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
