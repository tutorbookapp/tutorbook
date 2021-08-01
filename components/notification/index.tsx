import { ReactNode } from 'react';

import styles from './notification.module.scss';

export interface NotificationProps {
  header: string;
  children?: ReactNode;
}

export default function Notification({
  header,
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
