import React, { useMemo, useCallback, ElementRef } from 'react';

import useTranslation from 'next-translate/useTranslation';

import { ResizeDirection } from 're-resizable';
import { Rnd, DraggableData, ResizableDelta, Position } from 'react-rnd';
import { Timeslot, DayAlias, Callback } from 'lib/model';
import { TimeUtils } from 'lib/utils';

import styles from './timeslot-rnd.module.scss';

interface TimeslotRndProps {
  value: Timeslot;
  onChange: Callback<Timeslot>;
}

/**
 * Gets the height of the RND component representing a given timeslot. Assumes
 * every 12px represents 15mins.
 */
function getHeight({ from: start, to: end }: Timeslot): number {
  const minsDuration = (end.valueOf() - start.valueOf()) / 60000;
  return (minsDuration / 15) * 12;
}

/**
 * Gets the position of the RND component representing a given timeslot. Assumes
 * the first column is Sunday and each column is 82px wide. Assumes that each
 * column begins with 12am (midnight) and that every 12px represents 15mins.
 * @todo What do we do when the given timeslot isn't within 15min increments?
 */
function getPosition({ from: start }: Timeslot): Position {
  const minsFromMidnight = start.getHours() * 60 + start.getMinutes();
  return { x: start.getDay() * 82, y: (minsFromMidnight / 15) * 12 };
}

/**
 * In our calendar grid, there are 48px to each hour. We allow users to specify
 * availability in 15min (or 12px) increments. This wrapper class calculates and
 * updates the `react-rnd` position and size based on a given `Timeslot` value.
 * Note that this component **only** cares about the hours and minutes in the
 * `Timeslot` (i.e. you must position it into the correct date column yourself).
 */
export default function TimeslotRnd({
  value,
  onChange,
}: TimeslotRndProps): JSX.Element {
  const { lang: locale } = useTranslation();

  const position = useMemo<Position>(() => getPosition(value), [value]);
  const height = useMemo<number>(() => getHeight(value), [value]);

  const update = useCallback(
    (newHeight: number, newPosition: Position) => {
      // Each column is 82px wide, so we merely divide to figure out which column
      // the `TimeslotRnd` is located (e.g. 0 = Sunday, 1 = Monday, etc).
      const weekday: DayAlias = (newPosition.x / 82) as DayAlias;

      // The `TimeslotRnd` is set to snap every 12px which represents 15min
      // intervals. Midnight is shown at the top of the grid.
      const minsFromMidnight = (newPosition.y / 12) * 15;
      const minsDuration = (newHeight / 12) * 15;

      const hours = Math.floor(minsFromMidnight / 60);
      const mins = minsFromMidnight % 60;
      const start = TimeUtils.getDate(weekday, hours, mins);
      const end = new Date(start.valueOf() + minsDuration * 60000);

      onChange(new Timeslot(start, end));
    },
    [onChange]
  );

  const onResizeStop = useCallback(
    (
      e: MouseEvent | TouchEvent,
      dir: ResizeDirection,
      ref: ElementRef<'div'>,
      delta: ResizableDelta
    ) => {
      update(Number(ref.style.height.replace('px', '')), {
        x: position.x - (dir === 'left' ? delta.width : 0),
        y: position.y - (dir === 'top' ? delta.height : 0),
      });
    },
    [update, position]
  );

  const onDragStop = useCallback(
    (
      e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent,
      data: DraggableData
    ) => {
      // Use the `lastY` to avoid jumping off of the original drag grid.
      // @see {@link https://github.com/STRML/react-draggable/issues/413}
      // @see {@link https://github.com/bokuweb/react-rnd/issues/453}
      update(height, { x: data.lastX, y: data.lastY });
    },
    [update, height]
  );

  return (
    <Rnd
      className={styles.timeslot}
      position={getPosition(value)}
      size={{ width: 70, height: getHeight(value) }}
      onResizeStop={onResizeStop}
      onDragStop={onDragStop}
      bounds='parent'
      resizeGrid={[0, 12]}
      dragGrid={[82, 12]}
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
      {`${value.from.toLocaleString(locale, {
        hour: '2-digit',
        minute: '2-digit',
      })} - ${value.to.toLocaleString(locale, {
        hour: '2-digit',
        minute: '2-digit',
      })}`}
    </Rnd>
  );
}
