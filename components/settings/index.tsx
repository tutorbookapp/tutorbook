import { ReactNode } from 'react';
import useTranslation from 'next-translate/useTranslation';

import Header from 'components/header';

import { Org } from 'lib/model';

import Links from './links';
import styles from './settings.module.scss';

interface SettingsProps {
  org: Org;
  active: 'general' | 'home' | 'signup' | 'zoom';
  children: ReactNode;
}

export default function Settings({
  org,
  active,
  children,
}: SettingsProps): JSX.Element {
  const { t } = useTranslation();
  return (
    <>
      <Header
        header={t('common:settings')}
        body={t('settings:subtitle', { name: org.name })}
      />
      <div className={styles.wrapper}>
        <div className={styles.left}>
          <Links orgId={org.id} active={active} />
        </div>
        <div className={styles.right}>{children}</div>
      </div>
    </>
  );
}
