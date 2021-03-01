import { RRule } from 'rrule';

import { Timeslot } from 'lib/model';

/**
 * Get the last possible timeslot end time taking into account recurrence rules.
 * Calculated at indexing time and used query time to filter meetings.
 * @see {@link https://github.com/tutorbookapp/tutorbook#recurring-meetings}
 * @see {@link https://npmjs.com/package/rrule}
 * @see {@link https://bit.ly/3q7ZaBk}
 */
export default function getLastTime(time: Timeslot): Date {
  const options = RRule.parseString(time.recur || 'RRULE:COUNT=1');
  const rrule = new RRule({ ...options, dtstart: time.from });
  if (!options.until && !options.count) return new Date(253402300799999);
  return new Date((rrule.all().pop() || time.from).valueOf() + time.duration);
}
