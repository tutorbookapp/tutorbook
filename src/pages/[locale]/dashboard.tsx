import React from 'react';

import { GetStaticProps, GetStaticPaths } from 'next';
import {
  defMsg,
  useIntl,
  getIntlProps,
  getIntlPaths,
  withIntl,
  IntlShape,
  IntlHelper,
  Msg,
} from '@tutorbook/intl';
import { useUser } from '@tutorbook/account';
import { Title, Placeholder } from '@tutorbook/dashboard';
import { TabHeader } from '@tutorbook/header';

import Intercom from '@tutorbook/react-intercom';
import Footer from '@tutorbook/footer';

import tabs from '@tutorbook/dashboard/msgs';

const msgs = defMsg({
  title: {
    id: 'dashboard.overview.title',
    defaultMessage: 'Overview',
  },
  description: {
    id: 'dashboard.overview.description',
    defaultMessage: 'Analytics dashboard for {name}',
  },
  placeholder: {
    id: 'dashboard.overview.placeholder',
    defaultMessage: 'COMING SOON',
  },
  viewSearch: {
    id: 'dashboard.overview.actions.view-search',
    defaultMessage: 'View search',
  },
});

/**
 * Ideally, we'd use Next.js's automatic static optimization to pre-render a
 * skeleton screen and then grab the user-specific data using SWR once Next.js
 * hydrates the page client-side (with the `org` query).
 *
 * But, we can't do this right now due to the way our localization is setup.
 * We can't use `getStaticPaths` for a subset of the dynamic paths (i.e. we have
 * to provide both the `org` and the `locale` paths). So we'd be forced to
 * render a skeleton screen in the default locale and then manually fetch the
 * needed translations client-side once Next.js hydrates the page (and we know
 * the `locale` query).
 *
 * So, we're just going to modify the desired specifications to have the various
 * dashboard screens in the same `/[locale]/dashboard/` route--regardless of
 * which account the dashboard is viewing (that will be managed by our
 * `AccountProvider`).
 *
 * @see {@link https://github.com/vinissimus/next-translate/issues/129}
 * @see {@link https://github.com/vercel/next.js/issues/14200}
 */
function OverviewDashboardPage(): JSX.Element {
  const intl: IntlShape = useIntl();
  const msg: IntlHelper = (m: Msg, v?: any) => intl.formatMessage(m, v);
  const {
    user: { name },
  } = useUser();
  return (
    <>
      <TabHeader
        tabs={[
          {
            label: msg(tabs.overview),
            active: true,
            href: '/dashboard',
          },
        ]}
      />
      <Title
        header={msg(msgs.title)}
        body={msg(msgs.description, { name })}
        actions={[
          {
            label: msg(msgs.viewSearch),
            href: '/search/[[...slug]]',
            as: '/search',
          },
        ]}
      />
      <Placeholder>{msg(msgs.placeholder)}</Placeholder>
      <Footer />
      <Intercom />
    </>
  );
}

export const getStaticProps: GetStaticProps = async (context) => ({
  props: await getIntlProps(context),
});

/* eslint-disable-next-line @typescript-eslint/require-await */
export const getStaticPaths: GetStaticPaths = async () => ({
  paths: getIntlPaths(),
  fallback: false,
});

export default withIntl(OverviewDashboardPage);
