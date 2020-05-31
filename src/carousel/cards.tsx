import { Ripple } from '@rmwc/ripple';
import { User } from '@tutorbook/model';

import Avatar from '@tutorbook/avatar';

import styles from './cards.module.scss';

interface UserCardProps {
  onClick: (event: React.SyntheticEvent<HTMLDivElement>) => any;
  user: User;
}

export function UserCard({ user, onClick }: UserCardProps): JSX.Element {
  return (
    <Ripple>
      <div className={styles.card} onClick={onClick}>
        <div className={styles.img}>
          <Avatar src={user.photo} />
        </div>
        <div className={styles.name}>{user.name}</div>
        <div className={styles.bio}>{user.bio}</div>
      </div>
    </Ripple>
  );
}

export function LoadingCard(): JSX.Element {
  return (
    <Ripple>
      <div className={styles.card}>
        <div className={styles.img}>
          <Avatar loading />
        </div>
        <div className={styles.name + ' ' + styles.loading}></div>
        <div className={styles.bio + ' ' + styles.loading}></div>
      </div>
    </Ripple>
  );
}
