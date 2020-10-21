import { DayAlias, Timeslot } from 'lib/model';
import { TimeUtils } from 'lib/utils';

interface Position {
  x: number;
  y: number;
}

export function getPosition(value: Timeslot, width = 82): Position {
  const { from: start } = value;
  const minsFromMidnight = start.getHours() * 60 + start.getMinutes();
  return { x: start.getDay() * width, y: (minsFromMidnight / 15) * 12 };
}

export function getHeight(value: Timeslot): number {
  const { from: start, to: end } = value;
  const minsDuration = (end.valueOf() - start.valueOf()) / 60000;
  return (minsDuration / 15) * 12;
}

// Converts a given position and height into a `Timeslot`. Assumes each hour is
// 48px wide (12px = 15min) and each weekday is 82px wide (though those numbers
// can be configured).
export function getTimeslot(
  height: number,
  position: Position,
  width = 82
): Timeslot {
  // Each column is 82px wide, so we merely divide to figure out which column
  // the `TimeslotRnd` is located (e.g. 0 = Sunday, 1 = Monday, etc).
  const weekday = Math.floor(position.x / width) as DayAlias;

  // This RND can represent timeslots not on 15min intervals (e.g. 8:37am to
  // 9:13am), but we snap back to 15min intervals when the RND is moved.
  const snappedPositionY = Math.round(position.y / 12);
  const snappedHeight = Math.round(height / 12);

  // The `TimeslotRnd` is set to snap every 12px which represents 15min
  // intervals. Midnight is shown at the top of the grid.
  const minsFromMidnight = snappedPositionY * 15;
  const minsDuration = snappedHeight * 15;

  const hours = Math.floor(minsFromMidnight / 60);
  const mins = minsFromMidnight % 60;
  const start = TimeUtils.getDate(weekday, hours, mins);
  const end = new Date(start.valueOf() + minsDuration * 60000);

  return new Timeslot(start, end);
}
