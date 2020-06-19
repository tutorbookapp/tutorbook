import React from 'react';

import { GetStaticProps, GetStaticPaths } from 'next';
import {
  useIntl,
  getIntlProps,
  getIntlPaths,
  withIntl,
  IntlShape,
  IntlHelper,
} from '@tutorbook/intl';
import { Overview } from '@tutorbook/dashboard';
import { TabHeader } from '@tutorbook/header';
import { useAccount } from '@tutorbook/firebase';
import { Org, User } from '@tutorbook/model';

import Intercom from '@tutorbook/react-intercom';
import Footer from '@tutorbook/footer';

import msgs from '@tutorbook/dashboard/msgs';

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
  const msg: IntlHelper = (message: Msg) => intl.formatMessage(message);
  return (
    <>
      <TabHeader
        tabs={[
          {
            label: msg(msgs.overview),
            active: true,
            href: '/dashboard',
          },
          {
            label: msg(msgs.people),
            active: false,
            href: '/dashboard/people',
          },
        ]}
      />
      <Overview />
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
