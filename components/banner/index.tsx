import React from 'react';

import styles from './banner.module.scss';

export default function Banner(): JSX.Element {
  const [hidden, setHidden] = React.useState<boolean>(false);
  return (
    <div className={styles.wrapper + (hidden ? ` ${styles.hidden}` : '')}>
      <div className={styles.content}>
        <span className={styles.desktopTitle}>
          We stand with the black community. Make our nation #BetterThanBefore
          by mentoring black youth.
        </span>
        <span className={styles.mobileTitle}>
          We stand with the black community.
        </span>
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
