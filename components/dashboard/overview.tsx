import React from 'react';

import { defineMessages } from 'react-intl';
import { useMsg, IntlHelper } from 'lib/intl';
import { Org, Account } from 'lib/model';

import Title from './title';
import Placeholder from './placeholder';

import styles from './overview.module.scss';

interface OverviewProps {
  account: Account;
}

const msgs = defineMessages({
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

export default function Overview({ account }: OverviewProps): JSX.Element {
  const msg: IntlHelper = useMsg();
  return (
    <>
      <Title
        header={msg(msgs.title)}
        body={msg(msgs.description, { name: account.name })}
        actions={[
          {
            label: msg(msgs.viewSearch),
            href: `${
              account instanceof Org ? '/[org]' : ''
            }/search/[[...slug]]`,
            as: `${account instanceof Org ? `/${account.id}` : ''}/search`,
          },
        ]}
      />
      <div className={styles.wrapper}>
        <Placeholder>{msg(msgs.placeholder)}</Placeholder>
      </div>
    </>
  );
}
