import styles from './spotlight.module.scss';

export interface SpotlightProps {
  num: number;
  header: string;
  body: string;
}

export default function Spotlight({
  num,
  header,
  body,
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
            <img
              src='https://notion.so/front/shared/replaces/wikis.png'
              alt='Logos of replaced software'
            />
          </div>
        </div>
      </div>
      <div className={styles.placeholder} />
    </div>
  );
}
