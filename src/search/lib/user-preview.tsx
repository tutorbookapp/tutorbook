import { User } from '@tutorbook/model';

import styles from './user-preview.module.scss';

export default function UserPreview({ user }: { user: User }): JSX.Element {
  return <div className={styles.wrapper}></div>;
}
