import React from 'react';
import useTranslation from 'next-translate/useTranslation';

import styles from './banner.module.scss';

export default function Banner(): JSX.Element {
  const { t } = useTranslation();
  const [hidden, setHidden] = React.useState<boolean>(false);
  return (
    <div className={styles.wrapper + (hidden ? ` ${styles.hidden}` : '')}>
      <div className={styles.content}>
        <span className={styles.desktopTitle}>
          {t('common:banner-desktop')}
        </span>
        <span className={styles.mobileTitle}>{t('common:banner-mobile')}</span>
      </div>
      <span
        className={styles.close}
        onClick={() => setHidden(true)}
        role='button'
      >
        <svg
          viewBox='0 0 24 24'
          width='18'
          height='18'
          stroke='currentColor'
          strokeWidth='1.5'
          strokeLinecap='round'
          strokeLinejoin='round'
          fill='none'
          shapeRendering='geometricPrecision'
          style={{ color: 'currentcolor' }}
        >
          <path d='M18 6L6 18' />
          <path d='M6 6l12 12' />
        </svg>
      </span>
    </div>
  );
}
