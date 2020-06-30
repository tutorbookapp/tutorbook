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
  const bioRef = React.useRef<HTMLDivElement>(null);
  const truncateBio = async () => {
    if (loading || !canUseDOM) return;
    const Dotdotdot = (await import('@tutorbook/dotdotdot-js')).default;
    /* eslint-disable-next-line no-new */
    if (bioRef.current) new Dotdotdot(bioRef.current, { watch: 'resize' });
  };

  React.useEffect(() => {
    void truncateBio();
  });

  return (
    <Ripple disabled={loading} onClick={onClick}>
      <li className={styles.listItem + (loading ? ` ${styles.disabled}` : '')}>
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
