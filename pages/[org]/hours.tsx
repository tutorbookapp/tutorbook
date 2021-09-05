import { useMemo } from 'react';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';

import Header from 'components/header';
import Page from 'components/page';
import Placeholder from 'components/placeholder';
import { TabHeader } from 'components/navigation';

import { PageProps, getPagePaths, getPageProps } from 'lib/page';
import { OrgContext } from 'lib/context/org';
import usePage from 'lib/hooks/page';
import { useUser } from 'lib/context/user';
import { withI18n } from 'lib/intl';

import common from 'locales/en/common.json';
import meeting from 'locales/en/meeting.json';

function OrgHoursPage(props: PageProps): JSX.Element {
  const { orgs } = useUser();
  const { query } = useRouter();
  const { t } = useTranslation();

  const org = useMemo(() => {
    const idx = orgs.findIndex((o) => o.id === query.org);
    if (idx < 0) return;
    return orgs[idx];
  }, [orgs, query.org]);

  usePage({
    name: 'Org Hours',
    url: `/${query.org as string}/hours`,
    org: query.org as string,
    login: true,
    admin: true,
  });

  return (
    <OrgContext.Provider value={{ org }}>
      <Page title={`${org?.name || 'Loading'} - Hours - Tutorbook`} {...props}>
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
              label: t('common:hours'),
              href: `/${query.org as string}/hours`,
            },
            {
              label: t('common:calendar'),
              href: `/${query.org as string}/calendar`,
            },
            {
              label: t('common:settings'),
              href: `/${query.org as string}/settings`,
            },
          ]}
        />
        <Header
          header='Hours'
          body={`View ${org ? `${org.name}'s` : 'your'} service hours`}
        />
        <div className='wrapper'>
          <Placeholder>COMING SOON</Placeholder>
        </div>
        <style jsx>{`
          .wrapper {
            max-width: var(--page-width-with-margin);
            padding: 0 24px;
            margin: 48px auto;
            list-style: none;
          }
        `}</style>
      </Page>
    </OrgContext.Provider>
  );
}

export const getStaticProps = getPageProps;
export const getStaticPaths = getPagePaths;

export default withI18n(OrgHoursPage, { common, meeting });
