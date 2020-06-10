import { Ripple } from '@rmwc/ripple';
import { Callback, User } from '@tutorbook/model';

import React from 'react';
import Avatar from '@tutorbook/avatar';
import styles from './result.module.scss';

interface Props {
  user?: User;
  onClick?: Callback<React.SyntheticEvent<HTMLElement>>;
  loading?: boolean;
}

export default function Result({ user, onClick, loading }: Props): JSX.Element {
  const loaderClass: string = loading ? ` ${styles.loading}` : '';
  return (
    <Ripple onClick={onClick}>
      <li className={styles.listItem}>
        <div className={styles.img}>
          <Avatar loading={loading} src={(user || {}).photo} />
        </div>
        <div className={styles.name + loaderClass}>{user && user.name}</div>
        <div className={styles.bio + loaderClass}>{user && user.bio}</div>
      </li>
    </Ripple>
  );
}
