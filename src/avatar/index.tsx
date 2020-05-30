import styles from './avatar.module.scss';

/**
 * This `Avatar` component will fill 100% of the width or height (which ever is
 * smaller) while maintaining a 1:1 aspect ratio. It will then scale, center and
 * crop the given image to fit that 1:1 area. If no image is given, the `Avatar`
 * is rendered as a gray square with the text 'No Photo' centered within.
 */
export default function Avatar({ src }: { src?: string }): JSX.Element {
  return (
    <div className={styles.wrapper}>
      <img className={styles.img} src={src} />
      {!src && <div className={styles.noImg}>No Photo</div>}
    </div>
  );
}
