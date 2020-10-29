/**
 * Checks if a date occurs on the same date as another.
 * @param date - The base date to compare against.
 * @param other - The other date to compare.
 * @return Whether or not the dates occur on the same year, month, and date.
 */
export function sameDate(date: Date, other: Date): boolean {
  return (
    date.getFullYear() === other.getFullYear() &&
    date.getMonth() === other.getMonth() &&
    date.getDate() === other.getDate()
  );
}

/**
 * Checks if a timeslot occurs on a given date.
 * @param timeslot - The timeslot to check.
 * @param date - The date which we expect the timeslot to be on.
 * @return Whether or not the timeslot occurs on the given date.
 */
export function timeslotOnDate(timeslot: Timeslot, date: Date): boolean {
  return sameDate(timeslot.from, date) && sameDate(timeslot.to, date);
}

/**
 * Number representing the day of the week. Follows the ECMAScript Date
 * convention where 0 denotes Sunday, 1 denotes Monday, etc.
 * @see {@link https://mzl.la/34l2dN6}
 * @todo Remove the circular dependency and don't define this twice (i.e. it's
 * already been defined in `lib/model/timeslot.ts` I think).
 */
export type DayAlias = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Returns the number of days in a given month in a given year.
 * @param month - The month to get the number of days for (0 = January).
 * @param [year] - The year for which we want to inspect. Defaults to the
 * current one.
 * @return The number of days in the given month.
 * @see {@link https://stackoverflow.com/a/1184359}
 */
export function getDaysInMonth(month: number, year?: number): number {
  return new Date(year || new Date().getFullYear(), month + 1, 0).getDate();
}

/**
 * Returns the weekday of the first day of a given month in a given year.
 * @param month - The month to get the weekday of the first day (0 = January).
 * @param [year] - The year for which we want to inspect. Defaults to the
 * current one.
 * @return The weekday of the the first day in the given month (0 = Sunday).
 */
export function getWeekdayOfFirst(month: number, year?: number): number {
  return new Date(year || new Date().getFullYear(), month, 1).getDay();
}

/**
 * Returns the next date from 1970-01-01T00:00:00Z (the origin of the Unix
 * timestamp) that has the given times.
 * @see {@link https://en.wikipedia.org/wiki/Unix_time}
 * @param hours - The hours that the returned date should have.
 * @param [minutes=0] - The minutes that the returned date should have.
 * @param [seconds=0] - The seconds that the returned date should have.
 * @param [milliseconds=0] - The milliseconds that the returned date should
 * have.
 */
export function getDateWithTime(
  hours: number,
  minutes = 0,
  seconds = 0,
  milliseconds = 0
): Date {
  return getNextDateWithTime(
    hours,
    minutes,
    seconds,
    milliseconds,
    new Date('1970-01-01T00:00:00Z')
  );
}

/**
 * Returns the next date (from now or from a given date) that has the given
 * times.
 * @param hours - The hours that the returned date should have.
 * @param minutes - The minutes that the returned date should have.
 * @param seconds - The seconds that the returned date should have.
 * @param milliseconds - The milliseconds that the returned date should have.
 * @param [now] - The date we should start from. Default is right now.
 */
export function getNextDateWithTime(
  hours: number,
  minutes: number,
  seconds: number,
  milliseconds: number,
  now: Date = new Date()
): Date {
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hours,
    minutes,
    seconds,
    milliseconds
  );
}

/**
 * Returns the next date (from a given date) that has the given day (does not
 * change the times on the given date).
 * @param day - The integer representing the desired day (e.g. 0 for Sunday).
 * @param [now] - The starting point and the date to get the time values
 * from (i.e. the hours, minutes, seconds, milliseconds, year, month, etc).
 * Default is right now.
 * @todo Why do we have a counter (originally from `@tutorboook/utils`)?
 */
export function getNextDateWithDay(
  weekday: DayAlias,
  now: Date = new Date()
): Date {
  const date = new Date(now.valueOf());
  let count = 0; // TODO: Why did we add this counter in `lib/utils`?
  while (date.getDay() !== weekday && count <= 256) {
    date.setDate(date.getDate() + 1);
    count += 1;
  }
  return date;
}

/**
 * Helper function that combines `getDateWithTime` and `getNextDateWithDay` to
 * produce a function that returns a `Date` representing a weekly recurring
 * timestamp (i.e. the first occurance of the desired time as a Unix time).
 */
export function getDate(
  weekday: DayAlias,
  hours: number,
  minutes = 0,
  seconds = 0,
  milliseconds = 0
): Date {
  const time: Date = getDateWithTime(hours, minutes, seconds, milliseconds);
  return getNextDateWithDay(weekday, time);
}
