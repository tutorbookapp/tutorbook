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

import { useClickContext } from 'lib/hooks/click-outside';

import { MouseEventHackData, MouseEventHackTarget } from '../hack-types';
import { getHeight, getMeeting, getPosition } from '../utils';
import { RND_MARGIN } from '../config';
import { useCalendarState } from '../state';

import MeetingContent from './content';
import styles from './rnd.module.scss';

const Rnd = dynamic<Props>(() => import('react-rnd').then((m) => m.Rnd));

export interface MeetingRndProps {
  now: Date;
  width: number;
  eventTarget?: MouseEventHackTarget;
  eventData?: MouseEventHackData;
}

export default function MeetingRnd({
  now,
  width,
  eventTarget,
  eventData,
}: MeetingRndProps): JSX.Element {
  const {
    editing,
    setEditing,
    onEditStop,
    setDragging,
    setRnd,
    start,
  } = useCalendarState();

  // Workaround for `react-rnd`'s unusual resizing behavior.
  // @see {@link https://codesandbox.io/s/1z7kjjk0pq?file=/src/index.js}
  // @see {@link https://github.com/bokuweb/react-rnd/issues/457}
  const [offset, setOffset] = useState<Position>({ x: 0, y: 0 });

  const position = useMemo(
    () => getPosition(editing.time.from, width + RND_MARGIN),
    [editing.time.from, width]
  );
  const height = useMemo(() => getHeight(editing.time), [editing.time]);

  const update = useCallback(
    (newHeight: number, newPosition: Position) => {
      setEditing(getMeeting(newHeight, newPosition, editing, width, start));
    },
    [start, width, setEditing, editing]
  );

  const onClick = useCallback((evt: ReactMouseEvent) => {
    evt.stopPropagation();
  }, []);
  const onResizeStop = useCallback(() => {
    // We have to wait a tick before resetting `draggingId` to prevent new
    // editings from being created when the resize cursor moves ahead of RND.
    setTimeout(() => setDragging(false), 0);
    setOffset({ x: 0, y: 0 });
    if (editing.id.startsWith('temp')) return;
    onEditStop();
    setRnd(false);
  }, [setDragging, onEditStop, setRnd, editing.id]);
  const onDragStop = useCallback(() => {
    setTimeout(() => setDragging(false), 0);
    if (editing.id.startsWith('temp')) return;
    onEditStop();
    setRnd(false);
  }, [setDragging, onEditStop, setRnd, editing.id]);
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
      setDragging(true);
      update(Number(ref.style.height.replace('px', '')), {
        x: position.x - (dir === 'left' ? delta.width - offset.x : 0),
        y: position.y - (dir === 'top' ? delta.height - offset.y : 0),
      });
      setOffset((prev: Position) => ({
        x: dir === 'left' ? delta.width : prev.x,
        y: dir === 'top' ? delta.height : prev.y,
      }));
    },
    [setDragging, update, position, offset]
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
      setDragging(true);
      update(height, { x: data.x, y: data.y });
    },
    [setDragging, update, height]
  );

  const { updateEl, removeEl } = useClickContext();
  const ref = useCallback(
    (node: HTMLElement | null) => {
      if (!node) return removeEl('meeting-rnd');
      return updateEl('meeting-rnd', node);
    },
    [updateEl, removeEl]
  );

  return (
    <Rnd
      data-cy='editing-rnd'
      className={cn(styles.meeting, {
        [styles.past]: editing.time.to <= now,
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
        meeting={editing}
        height={height}
        eventTarget={eventTarget}
        eventData={eventData}
      />
    </Rnd>
  );
}
