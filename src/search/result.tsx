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

const canUseDOM = !!(
  typeof window !== 'undefined' &&
  window.document &&
  window.document.createElement
);

export default function Result({ user, onClick, loading }: Props): JSX.Element {
  const loaderClass: string = loading ? ` ${styles.loading}` : '';
  const bioRef = React.createRef<HTMLDivElement>();
  const truncateBio = async () => {
    if (loading || !canUseDOM) return;
    const Dotdotdot = (await import('dotdotdot-js')).default;
    if (bioRef.current) new Dotdotdot(bioRef.current, { watch: true });
  };

  React.useEffect(() => {
    void truncateBio();
  });

  return (
    <Ripple onClick={onClick}>
      <li className={styles.listItem}>
        <div className={styles.img}>
          <Avatar loading={loading} src={(user || {}).photo} />
        </div>
        <div className={styles.name + loaderClass}>{user && user.name}</div>
        <div ref={bioRef} className={styles.bio + loaderClass}>
          {user && user.bio}
        </div>
      </li>
    </Ripple>
  );
}
