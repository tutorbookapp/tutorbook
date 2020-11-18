import Image from 'next/image';
import cn from 'classnames';
import useTranslation from 'next-translate/useTranslation';

import { validPhoto } from 'lib/utils';

import styles from './avatar.module.scss';

interface AvatarProps {
  src?: string;
  loading?: boolean;
  size?: number;
}

/**
 * This `Avatar` component will fill 100% of the width or height (which ever is
 * smaller) while maintaining a 1:1 aspect ratio. It will then scale, center and
 * crop the given image to fit that 1:1 area. If no image is given, the `Avatar`
 * is rendered as a gray square with the text 'No Photo' centered within.
 * @todo Perhaps make the image verification less strict and only check if it is
 * able to be optimized instead of it is one of the newest GCP Storage buckets.
 */
export default function Avatar({
  loading,
  src = '',
  size = 500,
}: AvatarProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <div className={cn(styles.wrapper, { [styles.loading]: loading })}>
      {!loading && !!src && !validPhoto(src) && (
        <div className={styles.photoWrapper}>
          <img className={styles.photo} data-cy='avatar' src={src} alt='' />
        </div>
      )}
      {!loading && !!src && validPhoto(src) && (
        <Image
          data-cy='avatar'
          layout='fixed'
          height={size}
          width={size}
          src={src}
          alt=''
        />
      )}
      {!src && !loading && (
        <div className={styles.noPhotoWrapper}>
          <div className={styles.noPhoto}>{t('common:no-photo')}</div>
        </div>
      )}
    </div>
  );
}
