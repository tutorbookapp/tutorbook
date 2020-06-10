import React from 'react';

import styles from './avatar.module.scss';

interface AvatarProps {
  src?: string;
  loading?: boolean;
}

/**
 * This `Avatar` component will fill 100% of the width or height (which ever is
 * smaller) while maintaining a 1:1 aspect ratio. It will then scale, center and
 * crop the given image to fit that 1:1 area. If no image is given, the `Avatar`
 * is rendered as a gray square with the text 'No Photo' centered within.
 */
export default function Avatar({ src, loading }: AvatarProps): JSX.Element {
  return (
    <div className={styles.wrapper + (loading ? ` ${styles.loading}` : '')}>
      {!loading && <img className={styles.img} src={src} alt='' />}
      {!src && !loading && <div className={styles.noImg}>No Photo</div>}
    </div>
  );
}
