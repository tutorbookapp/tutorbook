import { ReactNode, useCallback, useEffect, useMemo, useRef } from 'react';
import { animated, useSpring } from 'react-spring';
import cn from 'classnames';
import mergeRefs from 'react-merge-refs';
import { ResizeObserver as polyfill } from '@juggle/resize-observer';
import useMeasure from 'react-use-measure';

import { Callback, Meeting, Position } from 'lib/model';
import { useClickContext } from 'lib/hooks/click-outside';

import { PREVIEW_MARGIN, RND_MARGIN } from './config';
import { getHeight, getPosition } from './utils';
import styles from './dialog.module.scss';

export interface CalendarDialogProps {
  meeting: Meeting;
  offset: Position;
  width: number;
  onClosed: () => void;
  setOpen: Callback<boolean>;
  open: boolean;
  children: ReactNode;
}

export default function CalendarDialog({
  meeting,
  offset,
  width: rndWidth,
  onClosed,
  setOpen,
  open,
  children,
}: CalendarDialogProps): JSX.Element {
  const measured = useRef<boolean>(false);

  useEffect(() => {
    setTimeout(() => {
      measured.current = true;
      setOpen(true);
    }, 0);
  }, [setOpen]);

  const [measureRef, bounds] = useMeasure({ polyfill });

  const rndPosition = useMemo(() => {
    return getPosition(meeting.time.from, rndWidth);
  }, [meeting.time.from, rndWidth]);
  const rndHeight = useMemo(() => {
    return getHeight(meeting.time);
  }, [meeting.time]);

  const onLeft = useMemo(() => {
    const x = offset.x + rndPosition.x - bounds.width - PREVIEW_MARGIN;
    return open ? x : x + 12;
  }, [offset.x, open, rndPosition.x, bounds.width]);
  const onRight = useMemo(() => {
    const x = offset.x + rndPosition.x + rndWidth - RND_MARGIN + PREVIEW_MARGIN;
    return open ? x : x - 12;
  }, [offset.x, open, rndPosition.x, rndWidth]);

  const alignedTop = useMemo(() => {
    return offset.y + rndPosition.y;
  }, [offset.y, rndPosition.y]);
  const alignedBottom = useMemo(() => {
    return offset.y + rndPosition.y - bounds.height + rndHeight;
  }, [offset.y, rndPosition.y, bounds.height, rndHeight]);
  const alignedCenter = useMemo(() => {
    return offset.y + rndPosition.y - 0.5 * (bounds.height - rndHeight);
  }, [offset.y, rndPosition.y, bounds.height, rndHeight]);
  const top = useMemo(() => {
    const vh = Math.max(
      document.documentElement.clientHeight || 0,
      window.innerHeight || 0
    );
    if (alignedCenter < 0) return alignedTop;
    if (alignedCenter + bounds.height > vh) return alignedBottom;
    return alignedCenter;
  }, [alignedTop, alignedCenter, alignedBottom, bounds.height]);

  const props = useSpring({
    // TODO: Clicking on match after closing begins should reverse animation.
    onRest: () => (!open && measured.current ? onClosed() : undefined),
    left: rndPosition.x < rndWidth * 3 ? onRight : onLeft,
    config: { tension: 250, velocity: 50 },
    immediate: !measured.current,
    top,
  });

  const { updateEl, removeEl } = useClickContext();
  const clickRef = useCallback(
    (node: HTMLElement | null) => {
      if (!node) return removeEl(`meeting-preview-${meeting.id}`);
      return updateEl(`meeting-preview-${meeting.id}`, node);
    },
    [updateEl, removeEl, meeting.id]
  );

  return (
    <div className={styles.scrimOuter}>
      <div className={styles.scrimInner}>
        <animated.div
          style={props}
          ref={mergeRefs([measureRef, clickRef])}
          className={cn(styles.wrapper, { [styles.open]: open })}
        >
          {children}
        </animated.div>
      </div>
    </div>
  );
}
