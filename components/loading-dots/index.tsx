import styles from './loading-dots.module.scss';

export interface LoadingDotsProps {
  size?: number;
}

export default function LoadingDots({
  size = 2,
}: LoadingDotsProps): JSX.Element {
  const style = { height: `${size}px`, width: `${size}px` };

  return (
    <span className={styles.loading}>
      <span style={style} />
      <span style={style} />
      <span style={style} />
    </span>
  );
}
