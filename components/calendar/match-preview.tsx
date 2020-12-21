import { MouseEvent, useEffect, useMemo, useRef, useState } from 'react';
import { animated, useSpring } from 'react-spring';
import { IconButton } from '@rmwc/icon-button';
import Link from 'next/link';
import cn from 'classnames';

import Avatar from 'components/avatar';

import { Match, Position } from 'lib/model';
import { join } from 'lib/utils';

import styles from './match-preview.module.scss';

export interface MatchPreviewProps {
  match: Match;
  position: Position;
  width?: number;
  onClosed: () => void;
}

export default function MatchPreview({
  match,
  position,
  width = 100,
  onClosed,
}: MatchPreviewProps): JSX.Element {
  const [open, setOpen] = useState<boolean>(false);
  const hasBeenOpened = useRef<boolean>(false);

  useEffect(() => {
    if (match && hasBeenOpened.current && !open) {
      const timeoutId = setTimeout(() => {
        hasBeenOpened.current = false;
        onClosed();
      }, 200);
      return () => clearTimeout(timeoutId);
    }
    return () => {};
  }, [match, onClosed, open]);
  useEffect(() => {
    if (match && !hasBeenOpened.current && !open) {
      setTimeout(() => {
        hasBeenOpened.current = true;
        setOpen(true);
      }, 0);
    }
  }, [match, open]);

  const onLeft = useMemo(() => {
    // TODO: Actually measure the width and don't assume 384px. When there are
    // more than two people in match, this will become an issue.
    const x = position.x - 384 - 6;
    return open ? x : x + 12;
  }, [open, position.x]);
  const onRight = useMemo(() => {
    const x = position.x + width - 4;
    return open ? x : x - 12;
  }, [open, position.x, width]);
  const props = useSpring({
    config: { tension: 250, velocity: 50 },
    left: position.x < width * 3 ? onRight : onLeft,
    top: position.y - 80,
  });

  return (
    <animated.div
      style={props}
      onClick={(evt: MouseEvent) => evt.stopPropagation()}
      className={cn(styles.wrapper, { [styles.open]: open })}
    >
      <div className={styles.nav}>
        <IconButton
          onClick={() => setOpen(false)}
          className={styles.btn}
          icon='close'
        />
      </div>
      <div className={styles.content}>
        <div className={styles.people}>
          {match.people.map((person) => (
            <Link href={`/${match.org}/users/${person.id}`} key={person.id}>
              <a className={styles.person}>
                <div className={styles.avatar}>
                  <Avatar src={person.photo} size={160} />
                </div>
                <div className={styles.name}>{person.name}</div>
                <div className={styles.roles}>{join(person.roles)}</div>
              </a>
            </Link>
          ))}
        </div>
        <div className={styles.info}>
          <dl>
            <dt>Subjects</dt>
            <dd>{join(match.subjects)}</dd>
          </dl>
          <dl>
            <dt>Meeting venue</dt>
            <dd>
              <a href={match.venue.url}>{match.venue.url}</a>
            </dd>
          </dl>
        </div>
      </div>
    </animated.div>
  );
}
