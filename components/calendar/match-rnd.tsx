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
import Router from 'next/router';
import dynamic from 'next/dynamic';

import { Match, TCallback, Timeslot } from 'lib/model';
import { join } from 'lib/utils';
import { prefetch } from 'lib/fetch';
import { useUser } from 'lib/context/user';

import { WIDTH, getHeight, getMatch, getPosition } from './utils';
import styles from './match-rnd.module.scss';

const Rnd = dynamic<Props>(() => import('react-rnd').then((m) => m.Rnd));

interface MatchRndProps {
  value: Match;
  width?: number;
  onChange: TCallback<Match | undefined>;
}

export default function MatchRnd({
  value,
  onChange,
  width = WIDTH,
}: MatchRndProps): JSX.Element {
  // Workaround for `react-rnd`'s unusual resizing behavior.
  // @see {@link https://codesandbox.io/s/1z7kjjk0pq?file=/src/index.js}
  // @see {@link https://github.com/bokuweb/react-rnd/issues/457}
  const [offset, setOffset] = useState<Position>({ x: 0, y: 0 });

  const position = useMemo(() => {
    return getPosition(value.time || new Timeslot(), width);
  }, [value.time, width]);
  const height = useMemo(() => {
    return getHeight(value.time || new Timeslot());
  }, [value.time]);

  const update = useCallback(
    (newHeight: number, newPosition: Position) => {
      onChange(getMatch(newHeight, newPosition, value, width));
    },
    [width, onChange, value]
  );

  // Only trigger `onClick` callback when user hasn't been dragging.
  const [dragging, setDragging] = useState<boolean>(false);

  const { user } = useUser();
  const other = useMemo(() => {
    const idx = value.people.findIndex((p) => p.id !== user.id);
    return value.people[idx] || user;
  }, [user, value.people]);

  const onClick = useCallback(
    async (evt: ReactMouseEvent) => {
      evt.stopPropagation();
      if (!dragging) await Router.push(`/${value.org}/matches/${value.id}`);
    },
    [dragging, value.id, value.org]
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

  useEffect(() => {
    void Router.prefetch(`/${value.org}/matches/${value.id}`);
  }, [value.org, value.id]);
  useEffect(() => {
    void prefetch(`/api/matches/${value.id}`);
    void prefetch(`/api/matches/${value.id}/people`);
    void prefetch(`/api/matches/${value.id}/meetings`);
  }, [value.id]);
  useEffect(() => {
    void prefetch(`/api/orgs/${value.org}`);
  }, [value.org]);

  return (
    <Rnd
      data-cy='match-rnd'
      style={{ cursor: dragging ? 'move' : 'pointer' }}
      className={styles.match}
      position={position}
      minHeight={12 * 4}
      size={{ width: width - 10, height }}
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
      <div className={styles.content}>
        {`${join(value.subjects)} with ${other.name}`}
      </div>
    </Rnd>
  );
}
