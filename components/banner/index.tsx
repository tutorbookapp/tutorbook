import { useState } from 'react';
import useTranslation from 'next-translate/useTranslation';
import cn from 'classnames';

import styles from './banner.module.scss';

export default function Banner(): JSX.Element {
  const { t } = useTranslation();
  const [hidden, setHidden] = useState<boolean>(false);
  return (
    <div
      data-cy='banner'
      className={cn(styles.wrapper, { [styles.hidden]: hidden })}
    >
      <div className={styles.content}>
        <span className={styles.desktopTitle}>{t('banner:desktop')}</span>
        <span className={styles.mobileTitle}>{t('banner:mobile')}</span>
      </div>
      <span
        tabIndex={0}
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
