import * as firebase from 'firebase';
import 'firebase/firestore';

/**
 * This is a painful workaround as we then import the entire Firebase library
 * definition while we only want the `Timestamp` object.
 * @todo Only import the `Timestamp` definition.
 * @see {@link https://stackoverflow.com/a/57984831/10023158}
 */
const Timestamp = firebase.firestore.Timestamp;
type Timestamp = firebase.firestore.Timestamp;

/**
 * Number representing the day of the week. Follows the ECMAScript Date
 * convention where 0 denotes Sunday, 1 denotes Monday, etc.
 * @see {@link https://mzl.la/34l2dN6}
 */
export type DayAlias = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Enum that makes it easier to work with the integer representations of the
 * various days of the week.
 * @see {@link https://www.typescriptlang.org/docs/handbook/enums.html#numeric-enums}
 */
export enum Day {
  Sunday,
  Monday,
  Tuesday,
  Wednesday,
  Thursday,
  Friday,
  Saturday,
}

/**
 * One's schedule contains all your booked timeslots (the inverse of one's
 * availability).
 */
export type ScheduleAlias = TimeslotInterface[];

/**
 * One's availability contains all your open timeslots (the inverse of one's
 * schedule).
 */
export type AvailabilityAlias = TimeslotInterface[];

/**
 * Interface that represents an availability time opening or slot. Note that
 * right now, we just assume that these are recurring weekly.
 */
export interface TimeslotInterface {
  from: Date;
  to: Date;
  recurrance?: 'monthly' | 'weekly' | 'daily';
}

// TODO: Remove this and support multiple languages.
const DAYS: Readonly<string[]> = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

/**
 * Class that represents a time opening or slot where tutoring can take place
 * (or where tutoring is taking place in the case of a booking). This provides
 * some useful methods for comparison and a better `toString` representation
 * than `[Object object]`.
 */
export class Timeslot implements TimeslotInterface {
  /**
   * Constructor that takes advantage of Typescript's shorthand assignment.
   * @see {@link https://bit.ly/2XjNmB5}
   */
  public constructor(public from: Date, public to: Date) {}

  /**
   * Returns if this timeslot contains another timeslot (i.e. the starting time
   * of the other timeslot is equal to or after the starting time of this
   * timeslot **and** the ending time of the other timeslot is equal to or
   * before the ending time of this timeslot).
   */
  public contains(other: Timeslot): boolean {
    return (
      other.from.valueOf() >= this.from.valueOf() &&
      other.to.valueOf() <= this.to.valueOf()
    );
  }

  /**
   * Puts the time slot into string form.
   * @example
   * // Where `dateAtTwoPM` and `dateAtThreePM` are on Mondays.
   * const timeslot = new Timeslot(dateAtTwoPM, dateAtThreePM);
   * assert(timeslot.toString() === 'Mondays from 2pm to 3pm');
   */
  public toString(includeDay: boolean = false): string {
    let str =
      this.from.toLocaleTimeString() + ' - ' + this.to.toLocaleTimeString();
    if (includeDay) {
      if (this.from.getDay() === this.to.getDay()) {
        str = DAYS[this.from.getDay()] + ' ' + str;
      } else {
        str =
          DAYS[this.from.getDay()] +
          ' ' +
          str.split(' - ')[0] +
          ' - ' +
          DAYS[this.to.getDay()] +
          ' ' +
          str.split(' - ')[1];
      }
    }
    return str;
  }

  public equalTo(timeslot: TimeslotInterface): boolean {
    return (
      timeslot.from.valueOf() === this.from.valueOf() &&
      timeslot.to.valueOf() === this.to.valueOf()
    );
  }

  public toFirestore(): TimeslotFirestoreInterface {
    return {
      from: Timestamp.fromDate(this.from),
      to: Timestamp.fromDate(this.to),
    };
  }

  /**
   * Takes in a Firestore timeslot record and returns a new `Timeslot` object.
   * @todo This should convert the Firestore `Timestamp` object into the native
   * `Date` object.
   */
  public static fromFirestore(data: TimeslotFirestoreInterface): Timeslot {
    return new Timeslot(data.from.toDate(), data.to.toDate());
  }

  public toJSON(): TimeslotJSONInterface {
    return { from: this.from.toISOString(), to: this.to.toISOString() };
  }

  public static fromJSON(json: TimeslotJSONInterface): Timeslot {
    return new Timeslot(new Date(json.from), new Date(json.to));
  }

  public toURLParam(): string {
    return encodeURIComponent(JSON.stringify(this));
  }

  public static fromURLParam(param: string): Timeslot {
    const params: URLSearchParams = new URLSearchParams(param);
    return new Timeslot(
      new Date(params.get('from') as string),
      new Date(params.get('to') as string)
    );
  }
}

/**
 * Interface that represents how `Timeslot`s are stored in our Firestore
 * database; with `Timestamp`s instead of `Date`s (b/c they're more accurate).
 */
export interface TimeslotFirestoreInterface {
  from: Timestamp;
  to: Timestamp;
}

/**
 * Interface that results from serializing the `Timeslot` object as JSON (i.e.
 * running `JSON.parse(JSON.stringify(timeslot))`) where the `from` and `to`
 * fields are both ISO strings.
 */
export interface TimeslotJSONInterface {
  from: string;
  to: string;
}

/**
 * Class that contains a bunch of time slots or openings that represents a
 * user's availability (inverse of their schedule, which contains a bunch of
 * booked time slots or appointments). This provides some useful methods for
 * finding time slots and a better `toString` representation than
 * `[Object object]`.
 */
export class Availability extends Array<Timeslot> implements AvailabilityAlias {
  public toString(): string {
    return this.length > 0
      ? this.map((timeslot) => timeslot.toString(true)).join(', ')
      : '';
  }

  public hasTimeslot(timeslot: TimeslotInterface): boolean {
    return !!this.filter((t) => t.equalTo(timeslot)).length;
  }

  public toFirestore(): TimeslotFirestoreInterface[] {
    return this.map((timeslot) => timeslot.toFirestore());
  }

  /**
   * Takes in an array of `Timeslot` objects (but w/ Firestore `Timestamp`
   * objects in the `from` and `to` fields instead of `Date` objects) and
   * returns an `Availability` object.
   */
  public static fromFirestore(
    data: TimeslotFirestoreInterface[]
  ): Availability {
    const availability: Availability = new Availability();
    data.forEach((t) => availability.push(Timeslot.fromFirestore(t)));
    return availability;
  }

  public toJSON(): TimeslotJSONInterface[] {
    return this.map((timeslot) => timeslot.toJSON());
  }

  public static fromJSON(json: TimeslotJSONInterface[]): Availability {
    const availability: Availability = new Availability();
    json.forEach((t) => availability.push(Timeslot.fromJSON(t) as Timeslot));
    return availability;
  }

  public toURLParam(): string {
    return encodeURIComponent(JSON.stringify(this));
  }

  public static fromURLParam(param: string): Availability {
    const availability: Availability = new Availability();
    const params: string[] = JSON.parse(decodeURIComponent(param));
    params.forEach((timeslot) => {
      availability.push(Timeslot.fromURLParam(timeslot));
    });
    return availability;
  }
}

/**
 * Class that contains some useful `Date` manipulation and creation utilities.
 */
export class TimeUtils {
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
    minutes: number = 0,
    seconds: number = 0,
    milliseconds: number = 0
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
      count++;
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
    minutes: number = 0,
    seconds: number = 0,
    milliseconds: number = 0
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
