import * as firebase from 'firebase/app';
import 'firebase/firestore';

import { DAYS } from './constants';

/**
 * This is a painful workaround as we then import the entire Firebase library
 * definition while we only want the `Timestamp` object.
 * @todo Only import the `Timestamp` definition.
 * @todo Add support for the server-side `Timestamp` definition as well; right
 * now, we're not even using these type definitions because the Firebase Admin
 * SDK is telling us that the client-side and server-side type definitions are
 * incompatible.
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
 * @deprecated We have no use of this for now (though we might in the future
 * when we implement a dashboard view).
 */
export type ScheduleAlias = TimeslotInterface[];

/**
 * One's availability contains all your open timeslots (the inverse of one's
 * schedule).
 */
export type AvailabilityAlias = TimeslotInterface[];
export type AvailabilityJSONAlias = TimeslotJSONInterface[];
export type AvailabilityFirestoreAlias = TimeslotFirestoreInterface[];

/**
 * Interface that represents an availability time opening or slot. Note that
 * right now, we just assume that these are recurring weekly.
 */
export interface TimeslotInterface {
  from: Date;
  to: Date;
  recurrance?: 'monthly' | 'weekly' | 'daily';
}

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
   * @deprecated We're going to put these into strings within the React tree so
   * that we can use `react-intl` for better i18n support (e.g. we'll set the
   * localization in the `pages/_app.tsx` top-level component and all children
   * components will render their `Date`s properly for that locale).
   */
  public toString(showDay: boolean = true): string {
    let str =
      this.from.toLocaleTimeString() + ' - ' + this.to.toLocaleTimeString();
    if (showDay) {
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

  /**
   * Helper string conversion method that's **only** used by the `TimeslotInput`
   * to convert it's value into a timestring.
   * @todo Move the parsing logic from that input to this class.
   * @todo Merge this with the `toString()` method.
   * @todo Don't assume that the `from` and `to` times occur on the same day.
   * @deprecated We're going to put these into strings within the React tree so
   * that we can use `react-intl` for better i18n support (e.g. we'll set the
   * localization in the `pages/_app.tsx` top-level component and all children
   * components will render their `Date`s properly for that locale).
   */
  public toParsableString(): string {
    return (
      `${DAYS[this.from.getDay()]}s from ${this.from.getHours()}:` +
      `${('0' + this.from.getMinutes()).slice(-2)} AM to ` +
      `${this.to.getHours()}:${('0' + this.to.getMinutes()).slice(-2)} AM`
    );
  }

  public equalTo(timeslot: TimeslotInterface): boolean {
    return (
      timeslot.from.valueOf() === this.from.valueOf() &&
      timeslot.to.valueOf() === this.to.valueOf()
    );
  }

  /**
   * Converts this object into a `TimeslotFirestoreInterface` (i.e. instead of
   * `Date`s we use `Timestamp`s).
   * @todo Right now, this isn't really doing anything besides some sketchy
   * type assertions b/c the Firebase Admin Node.js SDK `Timestamp` type doesn't
   * match the client-side `firebase/app` library `Timestamp` type. We want to
   * somehow return a `Timestamp` type that can be used by both (but I can't
   * figure out how to do this, so I'm just returning `Date`s which are
   * converted into the *correct* `Timestamp` type by the Firebase SDK itself).
   */
  public toFirestore(): TimeslotFirestoreInterface {
    return {
      from: (this.from as unknown) as Timestamp,
      to: (this.to as unknown) as Timestamp,
    };
  }

  /**
   * Takes in a Firestore timeslot record and returns a new `Timeslot` object.
   */
  public static fromFirestore(data: TimeslotFirestoreInterface): Timeslot {
    return new Timeslot(data.from.toDate(), data.to.toDate());
  }

  public toJSON(): TimeslotJSONInterface {
    return { from: this.from.toJSON(), to: this.to.toJSON() };
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
  /**
   * Note that this method (`Availability.prototype.contains`) is **very**
   * different from the `Availability.prototype.hasTimeslot` method; this method
   * checks to see if any `Timeslot` contains the given `Timeslot` whereas the
   * `hasTimeslot` methods checks to see if this availability contains the exact
   * given `Timeslot`.
   */
  public contains(other: Timeslot): boolean {
    for (const timeslot of this) if (timeslot.contains(other)) return true;
    return false;
  }

  /**
   * Helper function to remove a given `Timeslot` from this `Availability`. Note
   * that this **does not** just remove that exact `Timeslot` but rather ensures
   * that there are no `Timeslot`s remaining that overlap with the given
   * `Timeslot` by (where A is the given `Timeslot` and B is a `Timeslot` in
   * `this`):
   * 1. If (they overlap; B's close time is contained w/in A):
   *   - B's open time is before A's open time AND;
   *   - B's close time is before A's close time AND;
   *   - B's close time is after A's open time.
   * Then we'll adjust B such that it's close time is equal to A's open time.
   * 2. If (B's open time is contained w/in A; opposite of scenario #1):
   *   - B's close time is after A's close time AND;
   *   - B's open time is before A's close time AND;
   *   - B's open time is after A's open time.
   * Then we'll adjust B's open time to be equal to A's close time.
   * 3. If (A contains B):
   *   - B's open time is after A's open time AND;
   *   - B's close time is before A's close time.
   * Then we'll remove B altogether.
   * 4. If (B contains A; opposite of scenario #2):
   *   - B's open time is before A's open time AND;
   *   - B's close time is after A's close time.
   * Then we'll split B into two timeslots (i.e. essentically cutting out A):
   *   - One timeslot will be `{ from: B.from, to: A.from }`
   *   - The other timeslot will be `{ from: A.to, to: B.to }`
   * 5. If B and A are equal, we just remove B altogether.
   * 6. Otherwise, we keep B and continue to the next check.
   */
  public remove(a: Timeslot): void {
    const temp: Availability = new Availability();
    const aFrom = a.from.valueOf();
    const aTo = a.to.valueOf();
    for (const b of this) {
      const bFrom = b.from.valueOf();
      const bTo = b.to.valueOf();
      if (bFrom < aFrom && bTo < aTo && bTo > aFrom) {
        // Adjust `b` such that it's close time is equal to `a`'s open time.
        b.to = new Date(aFrom);
        temp.push(b);
      } else if (bTo > aTo && bFrom < aTo && bFrom > aFrom) {
        // Adjust `b` such that it's open time is equal to `a`'s close time.
        b.from = new Date(aTo);
        temp.push(b);
      } else if (a.contains(b)) {
        // Remove `b` altogether (i.e. don't add to `temp`).
      } else if (b.contains(a)) {
        // Split `b` into two timeslots (i.e. essentially cutting out `a`).
        temp.push(new Timeslot(new Date(bFrom), new Date(aFrom)));
        temp.push(new Timeslot(new Date(aTo), new Date(bTo)));
      } else if (a.equalTo(b)) {
        // Remove `b` altogether (i.e. don't add to `temp`).
      } else {
        temp.push(b);
      }
    }
    this.length = 0;
    temp.forEach((timeslot: Timeslot) => this.push(timeslot));
  }

  /**
   * Converts this `Availability` into a comma-separated string of all of it's
   * constituent timeslots.
   * @deprecated We're going to put these into strings within the React tree so
   * that we can use `react-intl` for better i18n support (e.g. we'll set the
   * localization in the `pages/_app.tsx` top-level component and all children
   * components will render their `Date`s properly for that locale).
   */
  public toString(showDay: boolean = true): string {
    return this.length > 0
      ? this.map((timeslot: Timeslot) => timeslot.toString(showDay)).join(', ')
      : '';
  }

  public hasTimeslot(timeslot: TimeslotInterface): boolean {
    return !!this.filter((t) => t.equalTo(timeslot)).length;
  }

  public toFirestore(): AvailabilityFirestoreAlias {
    return Array.from(this.map((timeslot: Timeslot) => timeslot.toFirestore()));
  }

  /**
   * Takes in an array of `Timeslot` objects (but w/ Firestore `Timestamp`
   * objects in the `from` and `to` fields instead of `Date` objects) and
   * returns an `Availability` object.
   */
  public static fromFirestore(data: AvailabilityFirestoreAlias): Availability {
    const availability: Availability = new Availability();
    data.forEach((t) => availability.push(Timeslot.fromFirestore(t)));
    return availability;
  }

  /**
   * Returns a basic `Array` object containing `TimeslotJSONInterface`s. Note
   * that we **must** wrap the `this.map` statement with an `Array.from` call
   * because otherwise, we'd just return an invalid `Availability` object (which
   * would cause subsequent `toJSON` calls to fail because the new array
   * wouldn't contain valid `Timeslot` objects).
   */
  public toJSON(): AvailabilityJSONAlias {
    return Array.from(this.map((timeslot: Timeslot) => timeslot.toJSON()));
  }

  public static fromJSON(json: AvailabilityJSONAlias): Availability {
    const availability: Availability = new Availability();
    json && json.forEach((t) => availability.push(Timeslot.fromJSON(t)));
    return availability;
  }

  public toURLParam(): string {
    return encodeURIComponent(JSON.stringify(this));
  }

  public static fromURLParam(param: string): Availability {
    const availability: Availability = new Availability();
    const params: string[] = JSON.parse(decodeURIComponent(param));
    params.forEach((timeslotParam: string) => {
      availability.push(Timeslot.fromURLParam(timeslotParam));
    });
    return availability;
  }

  /**
   * Checks if two availabilities contain all the same timeslots by ensuring
   * that:
   * 1. This availability contains all the timeslots of the other availability.
   * 2. The other availability contains all the timeslots of this availability.
   */
  public equalTo(other: Availability): boolean {
    for (const timeslot of other) {
      if (!this.hasTimeslot(timeslot)) return false;
    }
    for (const timeslot of this) {
      if (!other.hasTimeslot(timeslot)) return false;
    }
    return true;
  }
}

/**
 * Class that contains some useful `Date` manipulation and creation utilities.
 * @todo Move this class to the `@tutorbook/utils` package.
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
