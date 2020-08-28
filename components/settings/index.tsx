import useTranslation from 'next-translate/useTranslation';

import Header from 'components/header';
import Placeholder from 'components/placeholder';

import { Org } from 'lib/model';

import styles from './settings.module.scss';

interface SettingsProps {
  org: Org;
}

export default function Settings({ org }: SettingsProps): JSX.Element {
  const { t } = useTranslation();
  return (
    <>
      <Header
        header={t('common:settings')}
        body={t('settings:subtitle', { name: org.name })}
      />
      <div className={styles.wrapper}>
        <Placeholder>{t('settings:placeholder')}</Placeholder>
      </div>
    </>
  );
}
