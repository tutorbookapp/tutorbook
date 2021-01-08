import { DraggableData, Position, Props, ResizableDelta } from 'react-rnd';
import {
  ElementRef,
  MouseEvent as ReactMouseEvent,
  TouchEvent as ReactTouchEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ResizeDirection } from 're-resizable';
import axios from 'axios';
import { dequal } from 'dequal/lite';
import dynamic from 'next/dynamic';
import useTranslation from 'next-translate/useTranslation';

import { Callback, Meeting, MeetingJSON, Timeslot } from 'lib/model';
import { join } from 'lib/utils';
import { useContinuous } from 'lib/hooks';

import { getHeight, getMeeting, getPosition } from './utils';
import { RND_MARGIN } from './config';
import styles from './rnd.module.scss';

const Rnd = dynamic<Props>(() => import('react-rnd').then((m) => m.Rnd));

export interface MeetingRndProps {
  reference: Date;
  value: Meeting;
  width: number;
  setMutatedIds: Callback<Set<string>>;
  onChange: (updated: Meeting) => Promise<void>;
  onClick: (pos: Position, height: number) => void;
  onTouchStart: () => void;
  onMouseDown: () => void;
  onDrag: () => void;
}

export default function MeetingRnd({
  reference,
  width,
  value: local,
  setMutatedIds,
  onChange: updateLocal,
  onClick: clickHandler,
  onDrag: dragHandler,
  onTouchStart,
  onMouseDown,
}: MeetingRndProps): JSX.Element {
  const updateRemote = useCallback(
    async (updated: Meeting) => {
      const url = `/api/meetings/${updated.id}`;
      const { data } = await axios.put<MeetingJSON>(url, updated.toJSON());
      setMutatedIds((prev) => {
        const mutatedMeetingIds = new Set(prev);
        mutatedMeetingIds.delete(updated.id);
        if (dequal([...mutatedMeetingIds], [...prev])) return prev;
        return mutatedMeetingIds;
      });
      return Meeting.fromJSON(data);
    },
    [setMutatedIds]
  );

  // TODO: Debug `updateRemote` and `updateLocal` calls within `useContinuous`
  // to ensure that the `mutatedIds` are always properly up-to-date.
  const { data: meeting, setData: setMeeting } = useContinuous(
    local,
    updateRemote,
    updateLocal
  );

  // Workaround for `react-rnd`'s unusual resizing behavior.
  // @see {@link https://codesandbox.io/s/1z7kjjk0pq?file=/src/index.js}
  // @see {@link https://github.com/bokuweb/react-rnd/issues/457}
  const [offset, setOffset] = useState<Position>({ x: 0, y: 0 });

  const position = useMemo(() => {
    return getPosition(meeting.time, width);
  }, [meeting.time, width]);
  const height = useMemo(() => {
    return getHeight(meeting.time);
  }, [meeting.time]);

  const update = useCallback(
    (newHeight: number, newPosition: Position) => {
      setMeeting(getMeeting(newHeight, newPosition, meeting, width, reference));
    },
    [reference, width, setMeeting, meeting]
  );

  // Only trigger `onClick` callback when user hasn't been dragging.
  const [dragging, setDragging] = useState<boolean>(false);
  useEffect(() => {
    if (dragging) dragHandler();
  }, [dragging, dragHandler]);

  const onClick = useCallback(
    (evt: ReactMouseEvent) => {
      evt.stopPropagation();
      if (!dragging) clickHandler(position, height);
    },
    [dragging, clickHandler, position, height]
  );
  const onResizeStop = useCallback(() => {
    setTimeout(() => setDragging(false), 0);
    setOffset({ x: 0, y: 0 });
  }, []);
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
    [update, position, offset]
  );
  const onDragStop = useCallback(() => {
    setTimeout(() => setDragging(false), 0);
  }, []);
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
    [update, height]
  );

  const { lang: locale } = useTranslation();

  return (
    <Rnd
      data-cy='meeting-rnd'
      style={{ cursor: dragging ? 'move' : 'pointer' }}
      className={styles.meeting}
      position={position}
      minHeight={12 * 4}
      size={{ width: width - RND_MARGIN, height }}
      onResizeStop={onResizeStop}
      onResize={onResize}
      onClick={onClick}
      onDragStop={onDragStop}
      onDrag={onDrag}
      onTouchStart={onTouchStart}
      onMouseDown={onMouseDown}
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
      <div className={styles.content}>
        <div className={styles.subjects}>{join(meeting.match.subjects)}</div>
        <div className={styles.time}>
          {`${(meeting.time || new Timeslot()).from.toLocaleString(locale, {
            hour: 'numeric',
            minute: 'numeric',
          })} - ${(meeting.time || new Timeslot()).to.toLocaleString(locale, {
            hour: 'numeric',
            minute: 'numeric',
          })}`}
        </div>
      </div>
    </Rnd>
  );
}
