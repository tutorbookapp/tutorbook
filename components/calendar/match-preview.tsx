import { Chip, ChipSet } from '@rmwc/chip';
import {
  RefObject,
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { animated, useSpring } from 'react-spring';
import { IconButton } from '@rmwc/icon-button';
import Link from 'next/link';
import cn from 'classnames';
import mergeRefs from 'react-merge-refs';
import { ResizeObserver as polyfill } from '@juggle/resize-observer';
import useMeasure from 'react-use-measure';

import Avatar from 'components/avatar';

import { Callback, Match, Position } from 'lib/model';
import { join } from 'lib/utils';
import { useScrollLock } from 'lib/hooks';

import { PREVIEW_MARGIN, RND_MARGIN } from './config';
import styles from './match-preview.module.scss';

export interface MatchPreviewProps {
  match: Match;
  offset: Position;
  onClosed: () => void;
  width: number;
  height: number;
  position: Position;
  setOpen: Callback<boolean>;
  open: boolean;
}

type MatchPreviewRef =
  | RefObject<HTMLElement>
  | null
  | ((element: HTMLElement | null) => void);

export default forwardRef(function MatchPreview(
  {
    match,
    offset,
    onClosed,
    width: itemWidth,
    height: itemHeight,
    position: itemPosition,
    setOpen,
    open,
  }: MatchPreviewProps,
  ref: MatchPreviewRef
): JSX.Element {
  const measured = useRef<boolean>(false);

  useEffect(() => {
    setTimeout(() => {
      measured.current = true;
      setOpen(true);
    }, 0);
  }, [setOpen]);
  useScrollLock(open);

  const [previewRef, previewBounds] = useMeasure({ polyfill });

  const onLeft = useMemo(() => {
    const x = offset.x + itemPosition.x - previewBounds.width - PREVIEW_MARGIN;
    return open ? x : x + 12;
  }, [offset.x, open, itemPosition.x, previewBounds.width]);
  const onRight = useMemo(() => {
    const x =
      offset.x + itemPosition.x + itemWidth - RND_MARGIN + PREVIEW_MARGIN;
    return open ? x : x - 12;
  }, [offset.x, open, itemPosition.x, itemWidth]);

  const alignedTop = useMemo(() => {
    return offset.y + itemPosition.y;
  }, [offset.y, itemPosition.y]);
  const alignedBottom = useMemo(() => {
    return offset.y + itemPosition.y - previewBounds.height + itemHeight;
  }, [offset.y, itemPosition.y, previewBounds.height, itemHeight]);
  const alignedCenter = useMemo(() => {
    return (
      offset.y + itemPosition.y - 0.5 * (previewBounds.height - itemHeight)
    );
  }, [offset.y, itemPosition.y, previewBounds.height, itemHeight]);
  const top = useMemo(() => {
    const vh = Math.max(
      document.documentElement.clientHeight || 0,
      window.innerHeight || 0
    );
    if (alignedCenter < 0) return alignedTop;
    if (alignedCenter + previewBounds.height > vh) return alignedBottom;
    return alignedCenter;
  }, [alignedTop, alignedCenter, alignedBottom, previewBounds.height]);

  const props = useSpring({
    onRest: () => (!open && measured.current ? onClosed() : undefined),
    left: itemPosition.x < itemWidth * 3 ? onRight : onLeft,
    config: { tension: 250, velocity: 50 },
    immediate: !measured.current,
    top,
  });

  return (
    <div className={styles.scrimOuter}>
      <div className={styles.scrimInner}>
        <animated.div
          style={props}
          ref={mergeRefs([previewRef, ref])}
          onClick={(event) => event.stopPropagation()}
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
          <div className={styles.actions}>
            <ChipSet className={styles.chips}>
              <Chip icon='edit' label='Edit meeting' />
              <Chip icon='delete' label='Delete meeting' />
            </ChipSet>
          </div>
        </animated.div>
      </div>
    </div>
  );
});
