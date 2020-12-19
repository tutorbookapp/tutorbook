import { Position, getTimeslot } from 'components/availability-select/utils';

import { Match } from 'lib/model';

export const WIDTH = 100;

export function getMatch(
  height: number,
  position: Position,
  match?: Match,
  width: number = WIDTH
): Match {
  const time = getTimeslot(height, position, '', width);
  return new Match({ ...match, time });
}

export { getHeight, getPosition } from 'components/availability-select/utils';
