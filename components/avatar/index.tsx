import Image from 'next/image';
import cn from 'classnames';

import { validPhoto } from 'lib/utils';

import styles from './avatar.module.scss';

interface AvatarProps {
  size: number | 'dynamic';
  className?: string;
  priority?: boolean;
  loading?: boolean;
  src?: string;
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
  size,
  className,
  priority,
  loading,
  src,
}: AvatarProps): JSX.Element {
  const img = src || 'https://assets.tutorbook.org/pngs/profile.png';

  return (
    <div
      className={cn(styles.wrapper, className, { [styles.loading]: loading })}
    >
      {!loading && !!img && !validPhoto(img) && (
        <div className={styles.photoWrapper}>
          {priority && <link rel='preload' as='image' href={img} />}
          <img data-cy='avatar' className={styles.photo} src={img} alt='' />
        </div>
      )}
      {!loading && !!img && validPhoto(img) && size !== 'dynamic' && (
        <Image
          data-cy='avatar'
          priority={priority}
          layout='fixed'
          height={size}
          width={size}
          src={img}
          alt=''
        />
      )}
      {!loading && !!img && validPhoto(img) && size === 'dynamic' && (
        <div className={styles.photoWrapper}>
          <Image
            data-cy='avatar'
            layout='fill'
            objectFit='cover'
            objectPosition='center 50%'
            priority={priority}
            src={img}
            alt=''
          />
        </div>
      )}
    </div>
  );
}
