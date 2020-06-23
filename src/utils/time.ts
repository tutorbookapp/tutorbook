/**
 * Number representing the day of the week. Follows the ECMAScript Date
 * convention where 0 denotes Sunday, 1 denotes Monday, etc.
 * @see {@link https://mzl.la/34l2dN6}
 */
export type DayAlias = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Class that contains some useful `Date` manipulation and creation utilities.
 * @todo Move this class to the `@tutorbook/utils` package.
 */
export default class TimeUtils {
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
  public static getDateWithTime(
    hours: number,
    minutes = 0,
    seconds = 0,
    milliseconds = 0
  ): Date {
    return TimeUtils.getNextDateWithTime(
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
  private static getNextDateWithTime(
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
  public static getNextDateWithDay(
    day: DayAlias,
    now: Date = new Date()
  ): Date {
    const date = new Date(now.valueOf());
    let count = 0; // TODO: Why did we add this counter in `@tutorbook/utils`?
    while (date.getDay() !== day && count <= 256) {
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
  public static getDate(
    day: DayAlias,
    hours: number,
    minutes = 0,
    seconds = 0,
    milliseconds = 0
  ): Date {
    const time: Date = TimeUtils.getDateWithTime(
      hours,
      minutes,
      seconds,
      milliseconds
    );
    return TimeUtils.getNextDateWithDay(day, time);
  }
}
