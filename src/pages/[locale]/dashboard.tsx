import React from 'react';

import { GetStaticProps, GetStaticPaths } from 'next';
import {
  useIntl,
  defMsg,
  getIntlProps,
  getIntlPaths,
  withIntl,
  Msg,
  IntlShape,
  IntlHelper,
} from '@tutorbook/intl';
import { SwitchAccount, Overview, People } from '@tutorbook/dashboard';
import { LinkHeader, TabHeader } from '@tutorbook/header';
import { useAccount } from '@tutorbook/firebase';
import { Org, User } from '@tutorbook/model';

import Intercom from '@tutorbook/react-intercom';
import Footer from '@tutorbook/footer';

type Section = 'overview' | 'people';

const msgs: Record<Section, Msg> = defMsg({
  overview: {
    id: 'dashboard.tabs.overview',
    defaultMessage: 'Overview',
    description: 'Label for the overview tab of the dashboard page.',
  },
  people: {
    id: 'dashboard.tabs.people',
    defaultMessage: 'People',
    description: 'Label for the overview tab of the dashboard page.',
  },
});

function DashboardPage(): JSX.Element {
  const { account } = useAccount();
  const intl: IntlShape = useIntl();
  const msg: IntlHelper = (message: Msg) => intl.formatMessage(message);
  const [active, setActive] = React.useState<Section>('overview');
  const tabToSection: Record<string, Section> = {
    [msg(msgs.overview)]: 'overview',
    [msg(msgs.people)]: 'people',
  };
  return (
    <>
      {account instanceof Org && (
        <TabHeader
          tabs={[msg(msgs.overview), msg(msgs.people)]}
          active={msg(msgs[active])}
          onChange={(tab: string) => setActive(tabToSection[tab])}
        />
      )}
      {account instanceof User && <LinkHeader />}
      {account instanceof User && <SwitchAccount />}
      {account instanceof Org && active === 'overview' && <Overview />}
      {account instanceof Org && active === 'people' && <People />}
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

export default withIntl(DashboardPage);
