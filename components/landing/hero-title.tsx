import useTranslation from 'next-translate/useTranslation';

import Title from 'components/title';

import styles from './hero-title.module.scss';

export default function HeroTitle(): JSX.Element {
  const { t } = useTranslation();

  return (
    <div className={styles.wrapper}>
      <div className={styles.content}>
        <Title>{t('landing:hero-header')}</Title>
        <h3>{t('landing:hero-body')}</h3>
      </div>
    </div>
  );
}
