import styles from './title.module.scss';

export default function Title({ children }: { children: string }): JSX.Element {
  return (
    <div className={styles.background}>
      <h1 className={styles.title}>{children}</h1>
    </div>
  );
}
