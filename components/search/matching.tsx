import React, { useState, useCallback } from 'react';
import useSWR from 'swr';
import useMeasure from 'react-use-measure';
import { useSpring, animated } from 'react-spring';
import { ResizeObserver as polyfill } from '@juggle/resize-observer';
import { IconButton } from '@rmwc/icon-button';
import { User } from 'lib/model';

import Result from './result';

import styles from './matching.module.scss';

function MatchingResult({ id }: { id: string }): JSX.Element {
  const { data: user } = useSWR(`/api/users/${id}`);

  return (
    <Result
      user={user ? User.fromJSON(user) : new User()}
      onClick={() => console.log('TODO')}
      loading={!user}
    />
  );
}

interface MatchingProps {
  users: string[];
  onClosed: () => void;
}

export default function Matching({
  users,
  onClosed,
}: MatchingProps): JSX.Element {
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [ref, { height }] = useMeasure({ polyfill });
  const toggle = useCallback(() => setCollapsed((prev: boolean) => !prev), []);
  const props = useSpring({
    height: collapsed ? 0 : height,
    config: { tension: 250, friction: 32, clamp: true },
  });

  return (
    <div className={styles.wrapper}>
      <div className={styles.nav}>
        <IconButton
          onClick={toggle}
          className={styles.btn}
          icon={collapsed ? 'expand_less' : 'expand_more'}
        />
        <IconButton className={styles.btn} icon='close' />
      </div>
      <animated.div style={{ overflow: 'hidden', ...props }}>
        <div ref={ref} className={styles.content}>
          {users.map((id: string) => (
            <MatchingResult id={id} />
          ))}
        </div>
      </animated.div>
    </div>
  );
}
