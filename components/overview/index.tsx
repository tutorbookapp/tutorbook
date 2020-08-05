import React from 'react';
import Header from 'components/header';
import Placeholder from 'components/placeholder';

import useTranslation from 'next-translate/useTranslation';

import { Org, Account } from 'lib/model';

import styles from './overview.module.scss';

interface OverviewProps {
  account: Account;
}

export default function Overview({ account }: OverviewProps): JSX.Element {
  const { t } = useTranslation();
  return (
    <>
      <Header
        header={t('common:overview')}
        body={t('overview:subtitle', { name: account.name })}
        actions={[
          {
            label: t('overview:view-search'),
            href: `${
              account instanceof Org ? '/[org]' : ''
            }/search/[[...slug]]`,
            as: `${account instanceof Org ? `/${account.id}` : ''}/search`,
          },
        ]}
      />
      <div className={styles.wrapper}>
        <Placeholder>{t('overview:placeholder')}</Placeholder>
      </div>
    </>
  );
}
