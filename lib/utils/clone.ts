import rfdc from 'rfdc';

import { Availability, Timeslot } from 'lib/model';

function cloneTime(time: Timeslot): Timeslot {
  return new Timeslot(time.from, time.to, time.recur);
}

function cloneTimes(times: Availability): Availability {
  return new Availability(...times.map(cloneTime));
}

type Temp = Record<'availability' | 'times', Availability>;

// TODO: Perhaps try to get rid of all of these weird type workarounds.
export default function clone<T>(obj: T): T {
  const copy = (rfdc()(obj) as unknown) as Temp;
  const orig = (obj as unknown) as Temp;
  if (orig.availability) copy.availability = cloneTimes(orig.availability);
  if (orig.times) copy.times = cloneTimes(orig.times);
  return (copy as unknown) as T;
}
