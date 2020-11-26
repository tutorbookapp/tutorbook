import styles from './notification.module.scss';

export interface NotificationProps {
  header: string;
  intercom?: boolean;
  children?: React.ReactNode;
}

export default function Notification({
  header,
  intercom,
  children,
}: NotificationProps): JSX.Element {
  return (
    <div className={styles.wrapper}>
      <div className={styles.content}>
        <h3>{header}</h3>
        {children}
      </div>
    </div>
  );
}
