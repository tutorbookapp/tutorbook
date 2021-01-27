import { DraggableData, Position, Props, ResizableDelta } from 'react-rnd';
import {
  ElementRef,
  MouseEvent as ReactMouseEvent,
  TouchEvent as ReactTouchEvent,
  useCallback,
  useMemo,
  useState,
} from 'react';
import { ResizeDirection } from 're-resizable';
import cn from 'classnames';
import dynamic from 'next/dynamic';
import useTranslation from 'next-translate/useTranslation';

import { Meeting, TCallback, Timeslot } from 'lib/model';
import { join } from 'lib/utils';
import { useClickContext } from 'lib/hooks/click-outside';

import { getHeight, getMeeting, getPosition } from '../utils';
import { RND_MARGIN } from '../config';
import { useCalendar } from '../context';

import styles from './surface.module.scss';

const Rnd = dynamic<Props>(() => import('react-rnd').then((m) => m.Rnd));

export interface RndSurfaceProps {
  now: Date;
  width: number;
  elevated: boolean;
  meeting: Meeting;
  setMeeting: TCallback<Meeting>;
  draggingId?: string;
  setDraggingId: TCallback<string | undefined>;
  onClick?: () => void;
}

export default function RndSurface({
  now,
  width,
  elevated,
  meeting,
  setMeeting,
  draggingId,
  setDraggingId,
  onClick: clickHandler,
}: RndSurfaceProps): JSX.Element {
  const { updateEl, removeEl } = useClickContext();
  const { lang: locale } = useTranslation();
  const { startingDate } = useCalendar();

  const rndRef = useCallback(
    (node: HTMLElement | null) => {
      if (!node) return removeEl(`rnd-${meeting.id}`);
      return updateEl(`rnd-${meeting.id}`, node);
    },
    [updateEl, removeEl, meeting.id]
  );

  // Workaround for `react-rnd`'s unusual resizing behavior.
  // @see {@link https://codesandbox.io/s/1z7kjjk0pq?file=/src/index.js}
  // @see {@link https://github.com/bokuweb/react-rnd/issues/457}
  const [offset, setOffset] = useState<Position>({ x: 0, y: 0 });

  const position = useMemo(() => {
    return getPosition(meeting.time.from, width);
  }, [meeting.time.from, width]);
  const height = useMemo(() => {
    return getHeight(meeting.time);
  }, [meeting.time]);

  const update = useCallback(
    (newHeight: number, newPos: Position) => {
      setMeeting(getMeeting(newHeight, newPos, meeting, width, startingDate));
    },
    [startingDate, width, setMeeting, meeting]
  );

  const onClick = useCallback(
    (evt: ReactMouseEvent) => {
      evt.stopPropagation();
      if (clickHandler) clickHandler();
    },
    [clickHandler]
  );
  const onResizeStop = useCallback(() => {
    // Wait a tick so `draggingId` remains `true` which prevents certain event
    // listeners from triggering (e.g. the `onClick` listener in `Calendar`).
    setTimeout(() => setDraggingId(undefined), 0);
    setOffset({ x: 0, y: 0 });
  }, [setDraggingId]);
  const onDragStop = useCallback(() => {
    setTimeout(() => setDraggingId(undefined), 0);
  }, [setDraggingId]);
  const onResize = useCallback(
    (
      e: MouseEvent | TouchEvent,
      dir: ResizeDirection,
      ref: ElementRef<'div'>,
      delta: ResizableDelta
    ) => {
      // We use `offset` to ensure we don't duplicate position updates. This
      // callback can be called multiple times for the same resize delta. Thus,
      // we only want to update `position` to reflect the **difference** btwn
      // the last `delta` and the current `delta`.
      setDraggingId(meeting.id);
      update(Number(ref.style.height.replace('px', '')), {
        x: position.x - (dir === 'left' ? delta.width - offset.x : 0),
        y: position.y - (dir === 'top' ? delta.height - offset.y : 0),
      });
      setOffset((prev: Position) => ({
        x: dir === 'left' ? delta.width : prev.x,
        y: dir === 'top' ? delta.height : prev.y,
      }));
    },
    [setDraggingId, meeting.id, update, position, offset]
  );
  const onDrag = useCallback(
    (
      e: ReactMouseEvent | ReactTouchEvent | MouseEvent | TouchEvent,
      data: DraggableData
    ) => {
      // We don't have to use the `lastY` workaround b/c `react-draggable` snaps
      // correctly for the `onDrag` callback.
      // @see {@link https://github.com/STRML/react-draggable/issues/413}
      // @see {@link https://github.com/bokuweb/react-rnd/issues/453}
      setDraggingId(meeting.id);
      update(height, { x: data.x, y: data.y });
    },
    [setDraggingId, meeting.id, update, height]
  );

  const headerHeight = useMemo(() => Math.floor((height - 4) / 15) * 15, [
    height,
  ]);
  const timeString = useMemo(
    () =>
      `${(meeting.time || new Timeslot()).from.toLocaleString(locale, {
        hour: 'numeric',
        minute: 'numeric',
      })} - ${(meeting.time || new Timeslot()).to.toLocaleString(locale, {
        hour: 'numeric',
        minute: 'numeric',
      })}`,
    [meeting.time, locale]
  );

  return (
    <Rnd
      data-cy='meeting-rnd'
      style={{ cursor: draggingId === meeting.id ? 'move' : 'pointer' }}
      className={cn(styles.meeting, {
        [styles.elevated]: elevated,
        [styles.past]: meeting.time.to.valueOf() <= now.valueOf(),
      })}
      position={position}
      minHeight={12 * 2}
      size={{ width: width - RND_MARGIN, height }}
      onResizeStop={onResizeStop}
      onResize={onResize}
      onClick={onClick}
      onDragStop={onDragStop}
      onDrag={onDrag}
      bounds='parent'
      resizeGrid={[0, 12]}
      dragGrid={[width, 12]}
      enableResizing={{
        bottom: true,
        bottomLeft: false,
        bottomRight: false,
        left: false,
        right: false,
        top: true,
        topLeft: false,
        topRight: false,
      }}
    >
      <div ref={rndRef} className={styles.wrapper}>
        <div className={styles.content}>
          <div
            className={styles.header}
            style={{
              maxHeight: headerHeight > 30 ? headerHeight - 15 : 15,
              whiteSpace: headerHeight < 45 ? 'nowrap' : 'normal',
            }}
          >
            {!!meeting.match.subjects.length && (
              <span className={styles.subjects}>
                {join(meeting.match.subjects)}
              </span>
            )}
            {headerHeight < 30 && (
              <span className={styles.time}>
                {meeting.match.subjects.length ? `, ${timeString}` : timeString}
              </span>
            )}
          </div>
          {headerHeight > 15 && <div className={styles.time}>{timeString}</div>}
        </div>
      </div>
    </Rnd>
  );
}