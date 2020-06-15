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
import { SwitchAccount, People } from '@tutorbook/dashboard';
import { TabHeader } from '@tutorbook/header';
import { useAccount } from '@tutorbook/firebase';
import { Org, User } from '@tutorbook/model';

import Intercom from '@tutorbook/react-intercom';
import Footer from '@tutorbook/footer';

import msgs from '@tutorbook/dashboard/msgs';

function PeopleDashboardPage(): JSX.Element {
  const { account } = useAccount();
  const intl: IntlShape = useIntl();
  const msg: IntlHelper = (message: Msg) => intl.formatMessage(message);
  return (
    <>
      <TabHeader
        tabs={[
          {
            label: msg(msgs.overview),
            active: false,
            href: '/dashboard',
          },
          {
            label: msg(msgs.people),
            active: true,
            href: '/dashboard/people',
          },
        ]}
      />
      {account instanceof User && <SwitchAccount />}
      {account instanceof Org && <People />}
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

export default withIntl(PeopleDashboardPage);
