import styles from './loading-dots.module.scss';

export default function LoadingDots(): JSX.Element {
  return (
    <span className={styles.loading}>
      <span />
      <span />
      <span />
    </span>
  );
}
