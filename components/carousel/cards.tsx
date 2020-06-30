import { Ripple } from '@rmwc/ripple';
import { Callback, User } from '@tutorbook/model';

import React from 'react';
import Avatar from '@tutorbook/avatar';

import styles from './cards.module.scss';

interface UserCardProps {
  onClick: Callback<React.SyntheticEvent<HTMLDivElement>>;
  user: User;
}

export function UserCard({ user, onClick }: UserCardProps): JSX.Element {
  // TODO: Remove workaround for the jsx-a11y/click-events-have-key-events rule.
  return (
    <Ripple>
      <div
        className={styles.card}
        onClick={onClick}
        onKeyPress={() => {}}
        role='gridcell'
      >
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
    <Ripple disabled>
      <div className={`${styles.card} ${styles.disabled}`}>
        <div className={styles.img}>
          <Avatar loading />
        </div>
        <div className={`${styles.name} ${styles.loading}`} />
        <div className={`${styles.bio} ${styles.loading}`} />
      </div>
    </Ripple>
  );
}
