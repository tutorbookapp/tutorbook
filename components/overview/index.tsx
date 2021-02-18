import useTranslation from 'next-translate/useTranslation';

import Header from 'components/header';
import Placeholder from 'components/placeholder';

import { useOrg } from 'lib/context/org';

import styles from './overview.module.scss';

export default function Overview(): JSX.Element {
  const { t } = useTranslation();
  const { org } = useOrg();

  return (
    <>
      <Header
        header={t('common:overview')}
        body={t('overview:subtitle', { name: org ? `${org.name}'s` : 'your' })}
      />
      <div className={styles.wrapper}>
        <Placeholder>{t('overview:placeholder')}</Placeholder>
      </div>
    </>
  );
}
