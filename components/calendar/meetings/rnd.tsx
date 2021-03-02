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

import { Meeting } from 'lib/model/meeting';
import { TCallback } from 'lib/model/callback';
import { useClickContext } from 'lib/hooks/click-outside';

import { MouseEventHackData, MouseEventHackTarget } from '../hack-types';
import { getHeight, getMeeting, getPosition } from '../utils';
import { RND_MARGIN } from '../config';
import { useCalendar } from '../context';

import MeetingContent from './content';
import styles from './rnd.module.scss';

const Rnd = dynamic<Props>(() => import('react-rnd').then((m) => m.Rnd));

export interface MeetingRndProps {
  now: Date;
  width: number;
  meeting: Meeting;
  setMeeting: TCallback<Meeting>;
  setDraggingId: TCallback<string | undefined>;
  onEditStop?: () => void;
  eventTarget?: MouseEventHackTarget;
  eventData?: MouseEventHackData;
}

export default function MeetingRnd({
  now,
  width,
  meeting,
  setMeeting,
  setDraggingId,
  onEditStop,
  eventTarget,
  eventData,
}: MeetingRndProps): JSX.Element {
  const { startingDate } = useCalendar();

  // Workaround for `react-rnd`'s unusual resizing behavior.
  // @see {@link https://codesandbox.io/s/1z7kjjk0pq?file=/src/index.js}
  // @see {@link https://github.com/bokuweb/react-rnd/issues/457}
  const [offset, setOffset] = useState<Position>({ x: 0, y: 0 });

  const position = useMemo(
    () => getPosition(meeting.time.from, width + RND_MARGIN),
    [meeting.time.from, width]
  );
  const height = useMemo(() => getHeight(meeting.time), [meeting.time]);

  const update = useCallback(
    (newHeight: number, newPos: Position) => {
      setMeeting(getMeeting(newHeight, newPos, meeting, width, startingDate));
    },
    [startingDate, width, setMeeting, meeting]
  );

  const onClick = useCallback((evt: ReactMouseEvent) => {
    evt.stopPropagation();
  }, []);
  const onResizeStop = useCallback(() => {
    // We have to wait a tick before resetting `draggingId` to prevent new
    // meetings from being created when the resize cursor moves ahead of RND.
    setTimeout(() => setDraggingId(undefined), 0);
    setOffset({ x: 0, y: 0 });
    if (onEditStop) onEditStop();
  }, [setDraggingId, onEditStop]);
  const onDragStop = useCallback(() => {
    setTimeout(() => setDraggingId(undefined), 0);
    if (onEditStop) onEditStop();
  }, [setDraggingId, onEditStop]);
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

  const { updateEl, removeEl } = useClickContext();
  const ref = useCallback(
    (node: HTMLElement | null) => {
      if (!node) return removeEl(`meeting-rnd-${meeting.id}`);
      return updateEl(`meeting-rnd-${meeting.id}`, node);
    },
    [updateEl, removeEl, meeting.id]
  );

  return (
    <Rnd
      data-cy='meeting-rnd'
      className={cn(styles.meeting, {
        [styles.past]: meeting.time.to <= now,
      })}
      position={position}
      minHeight={12 * 2}
      size={{ width, height }}
      onResizeStop={onResizeStop}
      onResize={onResize}
      onClick={onClick}
      onDragStop={onDragStop}
      onDrag={onDrag}
      bounds='parent'
      resizeGrid={[0, 12]}
      dragGrid={[width + RND_MARGIN, 12]}
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
      <MeetingContent
        ref={ref}
        meeting={meeting}
        height={height}
        eventTarget={eventTarget}
        eventData={eventData}
      />
    </Rnd>
  );
}
