import { RRule } from 'rrule';

import { Timeslot } from 'lib/model';

// Ensure that the `until` value of an RRule isn't before the `time.from` value
// (which would prevent *any* meeting instances from being calculated).
export default function verifyRecurIncludesTime(time: Timeslot): string {
  const { until, ...options } = RRule.parseString(time.recur);
  if (!until || until >= time.to) return time.recur;
  // If the `until` value is before the timeslot end, we set it to the timeslot
  // end. Note that we could instead set it to the timeslot start (same effect).
  return RRule.optionsToString({ ...options, until: time.to });
}
