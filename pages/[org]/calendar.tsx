import { useMemo } from 'react';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';

import Calendar from 'components/calendar';
import Page from 'components/page';
import { TabHeader } from 'components/navigation';

import { PageProps, getPagePaths, getPageProps } from 'lib/page';
import { OrgContext } from 'lib/context/org';
import usePage from 'lib/hooks/page';
import { useUser } from 'lib/context/user';
import { withI18n } from 'lib/intl';

import calendar from 'locales/en/calendar.json';
import common from 'locales/en/common.json';
import meeting from 'locales/en/meeting.json';

function OrgCalendarPage(props: PageProps): JSX.Element {
  const { orgs } = useUser();
  const { query } = useRouter();
  const { t } = useTranslation();

  const org = useMemo(() => {
    const idx = orgs.findIndex((o) => o.id === query.org);
    if (idx < 0) return;
    return orgs[idx];
  }, [orgs, query.org]);

  usePage('Org Calendar', { login: true, admin: true });

  return (
    <OrgContext.Provider value={{ org }}>
      <Page
        title={`${org?.name || 'Loading'} - Calendar - Tutorbook`}
        {...props}
      >
        <TabHeader
          switcher
          tabs={[
            {
              label: t('common:overview'),
              href: `/${query.org as string}/overview`,
            },
            {
              label: t('common:users'),
              href: `/${query.org as string}/users`,
            },
            {
              active: true,
              label: t('common:calendar'),
              href: `/${query.org as string}/calendar`,
            },
            {
              label: t('common:settings'),
              href: `/${query.org as string}/settings`,
            },
          ]}
        />
        <Calendar org />
      </Page>
    </OrgContext.Provider>
  );
}

export const getStaticProps = getPageProps;
export const getStaticPaths = getPagePaths;

export default withI18n(OrgCalendarPage, { calendar, common, meeting });
