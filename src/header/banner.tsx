import React from 'react';

import styles from './banner.module.scss';

export default function Banner(): JSX.Element {
  const [hidden, setHidden] = React.useState<boolean>(false);
  return (
    <div className={styles.wrapper + (hidden ? ' ' + styles.hidden : '')}>
      <div className={styles.content}>
        <span className={styles.desktopTitle}>
          We stand with the black community. Make our nation #BetterThanBefore
          by mentoring black youth.
        </span>
        <span className={styles.mobileTitle}>
          We stand with the black community.
        </span>
      </div>
      <span className={styles.close} onClick={() => setHidden(true)}>
        <svg
          viewBox='0 0 24 24'
          width='18'
          height='18'
          stroke='currentColor'
          stroke-width='1.5'
          stroke-linecap='round'
          stroke-linejoin='round'
          fill='none'
          shape-rendering='geometricPrecision'
          style={{ color: 'currentcolor' }}
        >
          <path d='M18 6L6 18'></path>
          <path d='M6 6l12 12'></path>
        </svg>
      </span>
    </div>
  );
}
