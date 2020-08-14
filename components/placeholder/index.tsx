import styles from './placeholder.module.scss';

interface Props {
  children: string;
}

export default function Placeholder({ children }: Props): JSX.Element {
  return <div className={styles.empty}>{children}</div>;
}
