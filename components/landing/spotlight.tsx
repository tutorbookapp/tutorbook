import Video from 'components/video';

import styles from './spotlight.module.scss';

export interface SpotlightProps {
  num: number;
  header: string;
  body: string;
  mux: string;
  img: string;
}

export default function Spotlight({
  num,
  header,
  body,
  mux,
  img,
}: SpotlightProps): JSX.Element {
  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div className={styles.left}>
          <div className={styles.num}>{num}</div>
          <div className={styles.content}>
            <h2>{header}</h2>
            <div>{body}</div>
          </div>
        </div>
        <div className={styles.right}>
          <div>
            <div className={styles.label}>Replaces</div>
            <img src={img} alt='Logos of replaced software' />
          </div>
        </div>
      </div>
      <div className={styles.video}>
        <Video id={mux} autoplay loop />
      </div>
    </div>
  );
}
