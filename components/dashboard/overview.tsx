import React from 'react';
import useTranslation from 'next-translate/useTranslation';

import { Org, Account } from 'lib/model';

import Title from './title';
import Placeholder from './placeholder';

import styles from './overview.module.scss';

interface OverviewProps {
  account: Account;
}

export default function Overview({ account }: OverviewProps): JSX.Element {
  const { t } = useTranslation();
  return (
    <>
      <Title
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
