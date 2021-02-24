import Image from 'next/image';

import Video from 'components/video';

import styles from './spotlight.module.scss';

export interface SpotlightProps {
  num: number;
  header: string;
  body: string;
  mp4: string;
  webm: string;
  img: string;
}

export default function Spotlight({
  num,
  header,
  body,
  mp4,
  webm,
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
            <Image
              src={img}
              width={280}
              height={24}
              layout='fixed'
              alt='Logos of replaced software'
            />
          </div>
        </div>
      </div>
      <div className={styles.video}>
        <Video mp4={mp4} webm={webm} />
      </div>
    </div>
  );
}
