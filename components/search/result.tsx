import { SyntheticEvent, useEffect, useRef } from 'react';
import { Ripple } from '@rmwc/ripple';
import cn from 'classnames';

import Avatar from 'components/avatar';

import { TCallback, User } from 'lib/model';

import styles from './result.module.scss';

interface Props {
  user?: User;
  className?: string;
  onClick?: TCallback<SyntheticEvent<HTMLElement>>;
  loading?: boolean;
  avatar?: boolean;
}

const canUseDOM = !!(
  typeof window !== 'undefined' &&
  window.document &&
  window.document.createElement
);

export default function Result({
  user,
  className,
  onClick,
  loading,
  avatar = true,
}: Props): JSX.Element {
  const bioRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const truncateBio = async () => {
      if (loading || !canUseDOM) return;
      const Dotdotdot = (await import('@tutorbook/dotdotdot-js')).default;
      /* eslint-disable-next-line no-new */
      if (bioRef.current) new Dotdotdot(bioRef.current, { watch: 'resize' });
    };
    void truncateBio();
  });

  return (
    <Ripple disabled={loading} onClick={onClick}>
      <li
        className={cn(styles.listItem, className, {
          [styles.loading]: loading,
          [styles.avatar]: avatar,
        })}
      >
        {avatar && (
          <div className={styles.img}>
            <Avatar loading={loading} src={(user || {}).photo} />
          </div>
        )}
        <div className={styles.name}>{user && user.name}</div>
        <div ref={bioRef} className={styles.bio}>
          {user && user.bio}
        </div>
      </li>
    </Ripple>
  );
}
