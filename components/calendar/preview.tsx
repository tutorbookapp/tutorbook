import { animated, useSpring } from 'react-spring';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import cn from 'classnames';
import mergeRefs from 'react-merge-refs';
import { ResizeObserver as polyfill } from '@juggle/resize-observer';
import useMeasure from 'react-use-measure';

import DialogContent from 'components/dialog';
import { NavContext } from 'components/dialog/context';

import { Callback, Meeting, Position } from 'lib/model';
import { useClickContext } from 'lib/hooks/click-outside';

import { PREVIEW_MARGIN, RND_MARGIN } from './config';
import DisplayPage from './display-page';
import EditPage from './edit-page';
import styles from './preview.module.scss';

export enum Page {
  Display = 0,
  Edit,
}

export interface MeetingPreviewProps {
  meeting: Meeting;
  offset: Position;
  width: number;
  height: number;
  position: Position;
  onClosed: () => void;
  setOpen: Callback<boolean>;
  open: boolean;
}

export default function MeetingPreview({
  meeting,
  offset,
  onClosed,
  width: itemWidth,
  height: itemHeight,
  position: itemPosition,
  setOpen,
  open,
}: MeetingPreviewProps): JSX.Element {
  const measured = useRef<boolean>(false);

  useEffect(() => {
    setTimeout(() => {
      measured.current = true;
      setOpen(true);
    }, 0);
  }, [setOpen]);

  const [measureRef, bounds] = useMeasure({ polyfill });

  const onLeft = useMemo(() => {
    const x = offset.x + itemPosition.x - bounds.width - PREVIEW_MARGIN;
    return open ? x : x + 12;
  }, [offset.x, open, itemPosition.x, bounds.width]);
  const onRight = useMemo(() => {
    const x =
      offset.x + itemPosition.x + itemWidth - RND_MARGIN + PREVIEW_MARGIN;
    return open ? x : x - 12;
  }, [offset.x, open, itemPosition.x, itemWidth]);

  const alignedTop = useMemo(() => {
    return offset.y + itemPosition.y;
  }, [offset.y, itemPosition.y]);
  const alignedBottom = useMemo(() => {
    return offset.y + itemPosition.y - bounds.height + itemHeight;
  }, [offset.y, itemPosition.y, bounds.height, itemHeight]);
  const alignedCenter = useMemo(() => {
    return offset.y + itemPosition.y - 0.5 * (bounds.height - itemHeight);
  }, [offset.y, itemPosition.y, bounds.height, itemHeight]);
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
    left: itemPosition.x < itemWidth * 3 ? onRight : onLeft,
    config: { tension: 250, velocity: 50 },
    immediate: !measured.current,
    top,
  });

  const [active, setActive] = useState<number>(Page.Display);
  const [loading, setLoading] = useState<boolean>(false);
  const [checked, setChecked] = useState<boolean>(false);

  const openEdit = useCallback(() => setActive(Page.Edit), []);

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
          <NavContext.Provider value={() => setOpen(false)}>
            <DialogContent
              active={active}
              setActive={setActive}
              loading={loading}
              checked={checked}
            >
              <DisplayPage
                meeting={meeting}
                openEdit={openEdit}
                setLoading={setLoading}
                setChecked={setChecked}
              />
              <EditPage
                meeting={meeting}
                setLoading={setLoading}
                setChecked={setChecked}
              />
            </DialogContent>
          </NavContext.Provider>
        </animated.div>
      </div>
    </div>
  );
}
