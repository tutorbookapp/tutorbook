import { Availability, Timeslot } from 'lib/model';
import getUser from 'lib/api/get/user';
import getUserMatches from 'lib/api/get/user-matches';

/**
 * Returns the closest 15 min increment to a given start time but never goes
 * back in time (e.g. 9:41am becomes 9:45am, 9:56am becomes 10:00am).
 * @param start - The unrounded start time (e.g. 9:41am, 9:56am).
 * @param [interval] - The increment to round to in mins; default 15 mins.
 * @return The start time rounded up to the nearest 15 min interval.
 */
function roundStartTime(start: Date, interval = 15): Date {
  const mins = Math.ceil(start.getMinutes() / interval) * interval;
  const hrs = start.getHours(); // Do nothing; `Date` autocorrects for 60 mins.
  return new Date(start.getFullYear(), start.getMonth(), hrs, mins);
}

/**
 * Returns an array of timeslots of the given duration (default 30 mins) in the
 * given intervals (default 15 mins) between the given start and end times.
 * @param start - The start of the timeslot range (will be rounded to fit into
 * the given interval).
 * @param end - The end of the timeslot range.
 * @param [duration] - The timeslot duration in mins; default 30 mins.
 * @param [interval] - The time between each timeslot start time in mins;
 * default 15 mins.
 * @return An array of timeslots.
 */
function getTimeslots(
  start: Date,
  end: Date,
  duration = 30,
  interval = 15
): Availability {
  const timeslots = new Availability();
  let from = roundStartTime(start, interval);
  while (from.valueOf() < end.valueOf() - duration * 6e4) {
    const to = new Date(from.valueOf() + duration * 6e4);
    timeslots.push(new Timeslot(from, to));
    from = new Date(from.valueOf() + interval * 6e4);
  }
  return timeslots;
}

/**
 * Calculates the user's availability for a given time window and returns an
 * array of 30 min timeslots in 15 min increments. This considers the following:
 * 1. User defined "working hours" (i.e. the weekly recurring `availability`
 *    specified in his/her profile document).
 * 2. Matches and their weekly recurring `time`.
 * @param uid - The ID of the user whose availability we want to fetch.
 * @param start - The start of the timeslot range.
 * @param end - The end of the timeslot range.
 * @return An array of 30 min timeslots in 15 increments within the requested
 * `start` and `end` time window.
 */
export default async function getAvailability(
  uid: string,
  start: Date,
  end: Date
): Promise<Availability> {
  const user = await getUser(uid);
  const matches = await getUserMatches(uid);
  const timeslots = getTimeslots(start, end);
  return new Availability(
    ...timeslots.filter((timeslot) => {
      if (!user.availability.contains(timeslot)) return false;
      // TODO: Ensure that this also filters for overlaps with match times.
      if (matches.some((match) => match.times?.contains(timeslot)))
        return false;
      return true;
    })
  );
}
