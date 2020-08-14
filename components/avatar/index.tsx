import React from 'react';
import { TooltipProps } from '@rmwc/tooltip';
import dynamic from 'next/dynamic';

import styles from './avatar.module.scss';

const Tooltip = dynamic<TooltipProps>(() =>
  import('@rmwc/tooltip').then((m) => m.Tooltip)
);

interface AvatarProps {
  src?: string;
  loading?: boolean;
  verified?: string;
}

/**
 * This `Avatar` component will fill 100% of the width or height (which ever is
 * smaller) while maintaining a 1:1 aspect ratio. It will then scale, center and
 * crop the given image to fit that 1:1 area. If no image is given, the `Avatar`
 * is rendered as a gray square with the text 'No Photo' centered within.
 */
export default function Avatar({
  src,
  loading,
  verified,
}: AvatarProps): JSX.Element {
  return (
    <div className={styles.wrapper + (loading ? ` ${styles.loading}` : '')}>
      {verified && (
        <Tooltip
          content={<div className={styles.verifiedHover}>{verified}</div>}
          align='right'
          showArrow
        >
          <div className={styles.verifiedText}>Verified</div>
        </Tooltip>
      )}
      {!loading && <img className={styles.img} src={src} alt='' />}
      {!src && !loading && <div className={styles.noImg}>No Photo</div>}
    </div>
  );
}
