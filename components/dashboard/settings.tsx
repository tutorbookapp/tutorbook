import React from 'react';
import useTranslation from 'next-translate/useTranslation';

import { Account } from 'lib/model';

import Title from './title';
import Placeholder from './placeholder';

import styles from './overview.module.scss';

interface SettingsProps {
  account: Account;
}

export default function Settings({ account }: SettingsProps): JSX.Element {
  const { t } = useTranslation();
  return (
    <>
      <Title
        header={t('common:settings')}
        body={t('settings:subtitle', { name: account.name })}
      />
      <div className={styles.wrapper}>
        <Placeholder>{t('settings:placeholder')}</Placeholder>
      </div>
    </>
  );
}
