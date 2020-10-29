import { Availability, Timeslot } from 'lib/model';
import { getDaysInMonth } from 'lib/utils/time';
import getUser from 'lib/api/get/user';
import getUserMatches from 'lib/api/get/user-matches';

/**
 * Returns the closest 15 min increment to a given start time but never goes
 * back in time (e.g. 9:41am becomes 9:45am, 9:56am becomes 10:00am).
 * @param start - The unrounded start time (e.g. 9:41am, 9:56am).
 * @param [interval] - The increment to round to in mins; default 15 mins.
 * @return The start time rounded up to the nearest 15 min interval.
 */
export function roundStartTime(start: Date, interval = 15): Date {
  return new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate(),
    start.getHours(),
    Math.ceil(start.getMinutes() / interval) * interval
  );
}

/**
 * Returns an array of timeslots of the given duration (default 30 mins) in the
 * given intervals (default 15 mins) between the given start and end times.
 * @param start - The start of the timeslot range (inclusive); will be rounded
 * to fit into the given interval.
 * @param end - The end of the timeslot range (inclusive).
 * @param [duration] - The timeslot duration in mins; default 30 mins.
 * @param [interval] - The time between each timeslot start time in mins;
 * default 15 mins.
 * @return An array of timeslots.
 */
export function getTimeslots(
  start: Date,
  end: Date,
  duration = 30,
  interval = 15
): Availability {
  const timeslots = new Availability();
  let from = roundStartTime(start, interval);
  while (from.valueOf() <= end.valueOf() - duration * 6e4) {
    const to = new Date(from.valueOf() + duration * 6e4);
    timeslots.push(new Timeslot(from, to));
    from = new Date(from.valueOf() + interval * 6e4);
  }
  return timeslots;
}

/**
 * Calculates the user's availability for a given month and returns an array of
 * 30 min timeslots in 15 min increments. This considers the following:
 * 1. User defined "working hours" (i.e. the weekly recurring `availability`
 *    specified in his/her profile document).
 * 2. Matches and their weekly recurring `time`.
 * @param uid - The ID of the user whose availability we want to fetch.
 * @param month - The month to get timeslots for.
 * @param year - The year to get timeslots for.
 * @return An array of 30 min timeslots in 15 increments on the given month.
 */
export default async function getAvailability(
  uid: string,
  month: number,
  year: number
): Promise<Availability> {
  const interval = 15;
  const duration = 30;
  const days = getDaysInMonth(month, year);
  const offset = new Date(year, month, 1).getDay();

  // 1. Start with a baseline weekly recurring availability.
  const { availability: baseline } = await getUser(uid);

  // 2. Remove the weekly recurring match times from that availability.
  const matches = await getUserMatches(uid);
  matches.forEach((m) => m.times?.forEach((t) => baseline.remove(t)));

  // 3. Split each of the availability timeslots into 30 min timeslots in 15 min
  // intervals. This assumes there is no overlap between the baseline timeslots.
  const timeslots = new Availability();
  baseline.sort().forEach((timeslot) => {
    let from = roundStartTime(timeslot.from, interval);
    while (from.valueOf() <= timeslot.to.valueOf() - duration * 6e4) {
      const weekday = from.getDay();
      const fromHrs = from.getHours();
      const fromMins = from.getMinutes();
      const to = new Date(from.valueOf() + duration * 6e4);
      const toHrs = to.getHours();
      const toMins = to.getMinutes();
      // 4. Clone those weekly recurring timeslots into the month's date range.
      let date = 1;
      while (date <= days) {
        if (((date + offset) % 7) - 1 === weekday)
          timeslots.push(
            new Timeslot(
              new Date(year, month, date, fromHrs, fromMins),
              new Date(year, month, date, toHrs, toMins)
            )
          );
        date += 1;
      }
      from = new Date(from.valueOf() + interval * 6e4);
    }
  });

  return timeslots;
}
