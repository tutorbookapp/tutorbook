import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { animated, useSpring } from 'react-spring';
import cn from 'classnames';
import mergeRefs from 'react-merge-refs';
import { ResizeObserver as polyfill } from '@juggle/resize-observer';
import useMeasure from 'react-use-measure';

import { NavContext } from 'components/dialog/context';

import { Callback } from 'lib/model/callback';
import { Meeting } from 'lib/model/meeting';
import { Position } from 'lib/model/position';
import { useClickContext } from 'lib/hooks/click-outside';

import { PREVIEW_MARGIN, RND_MARGIN } from '../config';
import { getHeight, getPosition } from '../utils';

import styles from './surface.module.scss';

export interface DialogSurfaceProps {
  width: number;
  offset: Position;
  viewing: Meeting;
  dialogOpen: boolean;
  setDialogOpen: Callback<boolean>;
  onClosed: () => void;
  children: ReactNode;
}

// TODO: Close this dialog and re-open or otherwise prevent these expensive
// positioning calculations when opening and closing the FiltersSheet.
export default function DialogSurface({
  width: rndWidth,
  offset,
  viewing,
  dialogOpen,
  setDialogOpen,
  onClosed,
  children,
}: DialogSurfaceProps): JSX.Element {
  const measured = useRef<boolean>(false);
  const [visible, setVisible] = useState<boolean>(false);

  useEffect(() => {
    setTimeout(() => {
      measured.current = true;
      setVisible(true);
    }, 0);
  }, []);

  const [measureRef, bounds] = useMeasure({ polyfill });

  const rndPosition = useMemo(
    () => getPosition(viewing.time.from, rndWidth + RND_MARGIN),
    [viewing.time.from, rndWidth]
  );
  const rndHeight = useMemo(() => getHeight(viewing.time), [viewing.time]);

  const onLeft = useMemo(() => {
    const x = offset.x + rndPosition.x - bounds.width - PREVIEW_MARGIN;
    return visible && dialogOpen ? x : x + 12;
  }, [offset.x, visible, dialogOpen, rndPosition.x, bounds.width]);
  const onRight = useMemo(() => {
    const x = offset.x + rndPosition.x + rndWidth + PREVIEW_MARGIN;
    return visible && dialogOpen ? x : x - 12;
  }, [offset.x, visible, dialogOpen, rndPosition.x, rndWidth]);

  const alignedTop = useMemo(() => offset.y + rndPosition.y, [
    offset.y,
    rndPosition.y,
  ]);
  const alignedBottom = useMemo(
    () => offset.y + rndPosition.y - bounds.height + rndHeight,
    [offset.y, rndPosition.y, bounds.height, rndHeight]
  );
  const alignedCenter = useMemo(
    () => offset.y + rndPosition.y - 0.5 * (bounds.height - rndHeight),
    [offset.y, rndPosition.y, bounds.height, rndHeight]
  );
  const top = useMemo(() => {
    const vh = Math.max(
      document.documentElement.clientHeight || 0,
      window.innerHeight || 0
    );
    if (alignedCenter < 0) return alignedTop;
    if (alignedCenter + bounds.height > vh) return alignedBottom;
    return alignedCenter;
  }, [alignedTop, alignedCenter, alignedBottom, bounds.height]);

  // TODO: Clicking on match after closing begins should reverse animation.
  const props = useSpring({
    onRest: () => (!dialogOpen && measured.current ? onClosed() : undefined),
    left: rndPosition.x < rndWidth * 3 ? onRight : onLeft,
    config: { tension: 250, velocity: 50 },
    immediate: !measured.current,
    top,
  });

  const { updateEl, removeEl } = useClickContext();
  const clickRef = useCallback(
    (node: HTMLElement | null) => {
      if (!node) return removeEl(`dialog-${viewing.id}`);
      return updateEl(`dialog-${viewing.id}`, node);
    },
    [updateEl, removeEl, viewing.id]
  );

  return (
    <div className={styles.scrimOuter}>
      <div className={styles.scrimInner}>
        <animated.div
          style={props}
          ref={mergeRefs([measureRef, clickRef])}
          className={cn(styles.wrapper, {
            [styles.visible]: dialogOpen && visible,
          })}
        >
          <NavContext.Provider value={() => setDialogOpen(false)}>
            {children}
          </NavContext.Provider>
        </animated.div>
      </div>
    </div>
  );
}
