import React from 'react';

import { defMsg, useMsg, IntlHelper } from '@tutorbook/intl';
import { Account } from '@tutorbook/model';

import Title from './title';
import Placeholder from './placeholder';

import styles from './overview.module.scss';

interface OverviewProps {
  account: Account;
}

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
            href: '/search/[[...slug]]',
            as: '/search',
          },
        ]}
      />
      <div className={styles.wrapper}>
        <Placeholder>{msg(msgs.placeholder)}</Placeholder>
      </div>
    </>
  );
}
