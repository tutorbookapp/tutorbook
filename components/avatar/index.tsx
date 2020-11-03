import Image from 'next/image';
import { TooltipProps } from '@rmwc/tooltip';
import cn from 'classnames';
import dynamic from 'next/dynamic';
import useTranslation from 'next-translate/useTranslation';

import styles from './avatar.module.scss';

const Tooltip = dynamic<TooltipProps>(() =>
  import('@rmwc/tooltip').then((m) => m.Tooltip)
);

interface AvatarProps {
  src?: string;
  loading?: boolean;
  verified?: string;
  size?: number;
}

/**
 * This `Avatar` component will fill 100% of the width or height (which ever is
 * smaller) while maintaining a 1:1 aspect ratio. It will then scale, center and
 * crop the given image to fit that 1:1 area. If no image is given, the `Avatar`
 * is rendered as a gray square with the text 'No Photo' centered within.
 */
export default function Avatar({
  src = '',
  loading = false,
  size = 500,
  verified,
}: AvatarProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <div className={cn(styles.wrapper, { [styles.loading]: loading })}>
      {verified && (
        <Tooltip
          content={<div className={styles.verifiedHover}>{verified}</div>}
          align='right'
          showArrow
        >
          <div className={styles.verifiedText}>{t('common:verified')}</div>
        </Tooltip>
      )}
      {!loading && !!src && (
        <Image data-cy='avatar' height={size} width={size} src={src} alt='' />
      )}
      {!src && !loading && (
        <div className={styles.noPhotoWrapper}>
          <div className={styles.noPhoto}>{t('common:no-photo')}</div>
        </div>
      )}
    </div>
  );
}

Avatar.defaultProps = { src: undefined, loading: false, verified: undefined };
