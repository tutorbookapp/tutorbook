import React from 'react';
import { Ripple } from '@rmwc/ripple';

import Avatar from 'components/avatar';

import { TCallback, User } from 'lib/model';

import styles from './cards.module.scss';

interface UserCardProps {
  onClick: TCallback<React.SyntheticEvent<HTMLDivElement>>;
  user: User;
}

export function UserCard({ user, onClick }: UserCardProps): JSX.Element {
  // TODO: Remove workaround for the jsx-a11y/click-events-have-key-events rule.
  return (
    <Ripple>
      <div
        data-cy='user-card'
        tabIndex={0}
        className={styles.card}
        onClick={onClick}
        onKeyPress={() => {}}
        role='gridcell'
      >
        <div className={styles.img}>
          <Avatar src={user.photo} />
        </div>
        <div data-cy='name' className={styles.name}>
          {user.name}
        </div>
        <div data-cy='bio' className={styles.bio}>
          {user.bio}
        </div>
      </div>
    </Ripple>
  );
}

export function LoadingCard(): JSX.Element {
  return (
    <Ripple disabled>
      <div
        data-cy='loading-card'
        className={`${styles.card} ${styles.disabled}`}
      >
        <div className={styles.img}>
          <Avatar loading />
        </div>
        <div className={`${styles.name} ${styles.loading}`} />
        <div className={`${styles.bio} ${styles.loading}`} />
      </div>
    </Ripple>
  );
}
