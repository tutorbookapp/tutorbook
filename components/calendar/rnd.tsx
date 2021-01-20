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
import cn from 'classnames';
import dynamic from 'next/dynamic';
import useTranslation from 'next-translate/useTranslation';

import { Callback, Meeting, MeetingJSON, Timeslot } from 'lib/model';
import { join } from 'lib/utils';
import { useClickContext } from 'lib/hooks/click-outside';
import { useContinuous } from 'lib/hooks';

import { getHeight, getMeeting, getPosition } from './utils';
import { RND_MARGIN } from './config';
import styles from './rnd.module.scss';
import { useCalendar } from './context';

const Rnd = dynamic<Props>(() => import('react-rnd').then((m) => m.Rnd));

export interface MeetingRndProps {
  now: Date;
  width: number;
  meeting: Meeting;
  preview: Meeting | undefined;
  setPreview: Callback<Meeting | undefined>;
  closePreview: () => void;
}

export default function MeetingRnd({
  now,
  width,
  meeting: initialData,
  preview,
  setPreview,
  closePreview,
}: MeetingRndProps): JSX.Element {
  const updateRemote = useCallback(async (updated: Meeting) => {
    const url = `/api/meetings/${updated.id}`;
    const { data } = await axios.put<MeetingJSON>(url, updated.toJSON());
    return Meeting.fromJSON(data);
  }, []);

  const { lang: locale } = useTranslation();
  const { startingDate, mutateMeeting } = useCalendar();
  const { data: meeting, setData: setMeeting } = useContinuous(
    initialData,
    updateRemote,
    mutateMeeting
  );

  const { updateEl, removeEl } = useClickContext();
  const rndRef = useCallback(
    (node: HTMLElement | null) => {
      if (!node) return removeEl(`meeting-rnd-${meeting.id}`);
      return updateEl(`meeting-rnd-${meeting.id}`, node);
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
    (newHeight: number, newPosition: Position) => {
      setMeeting(
        getMeeting(newHeight, newPosition, meeting, width, startingDate)
      );
    },
    [startingDate, width, setMeeting, meeting]
  );

  const [dragging, setDragging] = useState<boolean>(false);
  useEffect(() => {
    if (dragging) closePreview();
  }, [dragging, closePreview]);

  const onClick = useCallback(
    (evt: ReactMouseEvent) => {
      evt.stopPropagation();
      if (!dragging) setPreview(meeting);
    },
    [setPreview, dragging, meeting]
  );
  const onResizeStop = useCallback(() => {
    setTimeout(() => setDragging(false), 0);
    setOffset({ x: 0, y: 0 });
  }, []);
  const onDragStop = useCallback(() => {
    setTimeout(() => setDragging(false), 0);
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
      style={{ cursor: dragging ? 'move' : 'pointer' }}
      className={cn(styles.meeting, {
        [styles.elevated]: dragging || preview?.id === meeting.id,
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
            <span className={styles.subjects}>
              {join(meeting.match.subjects)}
            </span>
            {headerHeight < 30 && (
              <span className={styles.time}>{`, ${timeString}`}</span>
            )}
          </div>
          {headerHeight > 15 && <div className={styles.time}>{timeString}</div>}
        </div>
      </div>
    </Rnd>
  );
}
