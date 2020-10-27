import { RRule } from 'rrule';
import * as admin from 'firebase-admin';

import { DAYS } from 'lib/model/constants';
import { isJSON } from 'lib/model/json';

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
 * This is a painful workaround as we then import the entire Firebase library
 * definition while we only want the `Timestamp` object.
 * @todo Only import the `Timestamp` definition.
 * @todo Add support for the server-side `Timestamp` definition as well; right
 * now, we're not even using these type definitions because the Firebase Admin
 * SDK is telling us that the client-side and server-side type definitions are
 * incompatible.
 * @see {@link https://stackoverflow.com/a/57984831/10023158}
 */
type Timestamp = admin.firestore.Timestamp;

/**
 * A timeslot is a window of time and provides all the necessary scheduling data
 * for any scenario.
 * @property from - The start time and date of this timeslot (typically
 * represented by a `Date`, `Timestamp`, or UTC date string).
 * @property to - The end time and date of this timeslot (represented in the
 * same format as the `from` property).
 * @property [recur] - The recurrance of this timeslot as specified in
 * [RFC 5545]{@link https://tools.ietf.org/html/rfc5545#section-3.8.5}. The
 * DTSTART is ignored as it should always be the `from` value. Default value is
 * always weekly.
 */
export interface TimeslotBase<T> {
  from: T;
  to: T;
  recur: string;
}

/**
 * Interface that represents an availability time opening or slot. Note that
 * right now, we just assume that these are recurring weekly.
 */
export type TimeslotInterface = TimeslotBase<Date>;

/**
 * Interface that represents how `Timeslot`s are stored in our Firestore
 * database; with `Timestamp`s instead of `Date`s (b/c they're more accurate).
 */
export type TimeslotFirestore = TimeslotBase<Timestamp>;

/**
 * Interface that results from serializing the `Timeslot` object as JSON (i.e.
 * running `JSON.parse(JSON.stringify(timeslot))`) where the `from` and `to`
 * fields are both ISO strings.
 */
export type TimeslotJSON = TimeslotBase<string>;
export type TimeslotSearchHit = TimeslotBase<number>;

export function isTimeslotJSON(json: unknown): json is TimeslotJSON {
  if (!isJSON(json)) return false;
  if (typeof json.from !== 'string') return false;
  if (typeof json.to !== 'string') return false;
  if (new Date(json.from).toString() === 'Invalid Date') return false;
  if (new Date(json.to).toString() === 'Invalid Date') return false;
  return true;
}

export class Timeslot implements TimeslotInterface {
  /**
   * Constructor that takes advantage of Typescript's shorthand assignment.
   * @see {@link https://bit.ly/2XjNmB5}
   */
  public constructor(
    public from: Date,
    public to: Date,
    public recur: string = 'RRULE:FREQ=WEEKLY'
  ) {}

  /**
   * @return The duration of this timeslot in milliseconds.
   * @todo Re-design the API of these timeslots to be a DTSTART time (i.e. the
   * FROM time), a DURATION (i.e. the value returned by this method), and a
   * RECUR rule.
   */
  public get duration(): number {
    return this.to.valueOf() - this.from.valueOf();
  }

  /**
   * Under the hood, I'm using `rrule` to take advantage of the recurrance rules
   * detailed in RFC 5545 to store timeslot data.
   * @return The `RRule` that represents this timeslot's start time.
   */
  public get rrule(): RRule {
    return new RRule({
      ...RRule.parseString(this.recur),
      dtstart: this.from,
    });
  }

  /**
   * Returns whether or not this timeslot contains the given timeslot.
   * @param other - The timeslot to check is within this timeslot.
   * @return Whether the starting time of this timeslot is before the starting
   * time of the other timeslot AND the ending time of this timeslot is after
   * the ending time of the other timeslot.
   */
  public contains(other: TimeslotInterface): boolean {
    const closestFrom = this.rrule.before(other.from, true);
    return (
      closestFrom.valueOf() <= other.from.valueOf() &&
      closestFrom.valueOf() + this.duration >= other.to.valueOf()
    );
  }

  /**
   * Returns whether or not this timeslot is equal to another.
   * @param other - The timeslot to check is equal to this one.
   * @return Whether the other timeslot is equal to this one.
   * @deprecated Just use a `dequal` instead.
   */
  public equalTo(other: TimeslotInterface): boolean {
    return (
      other.recur === this.recur &&
      other.to.valueOf() === this.to.valueOf() &&
      other.from.valueOf() === this.from.valueOf()
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
  public toString(showDay = true): string {
    let str = `${this.from.toLocaleTimeString()} - ${this.to.toLocaleTimeString()}`;
    if (showDay) {
      if (this.from.getDay() === this.to.getDay()) {
        str = `${DAYS[this.from.getDay()]} ${str}`;
      } else {
        str = `${DAYS[this.from.getDay()]} ${str.split(' - ')[0]} - ${
          DAYS[this.to.getDay()]
        } ${str.split(' - ')[1]}`;
      }
    }
    return str;
  }

  public toFirestore(): TimeslotFirestore {
    const { from, to, ...rest } = this;
    return {
      ...rest,
      from: (from as unknown) as Timestamp,
      to: (to as unknown) as Timestamp,
    };
  }

  public static fromFirestore(data: TimeslotFirestore): Timeslot {
    return new Timeslot(data.from.toDate(), data.to.toDate(), data.recur);
  }

  public toJSON(): TimeslotJSON {
    const { from, to, ...rest } = this;
    return { ...rest, from: from.toJSON(), to: to.toJSON() };
  }

  public static fromJSON(json: TimeslotJSON): Timeslot {
    return new Timeslot(new Date(json.from), new Date(json.to), json.recur);
  }

  public static fromSearchHit(hit: TimeslotSearchHit): Timeslot {
    return new Timeslot(new Date(hit.from), new Date(hit.to), hit.recur);
  }

  public toURLParam(): string {
    return encodeURIComponent(JSON.stringify(this));
  }

  public static fromURLParam(param: string): Timeslot {
    const params: URLSearchParams = new URLSearchParams(param);
    return new Timeslot(
      new Date(params.get('from') as string),
      new Date(params.get('to') as string),
      params.get('recur') || undefined
    );
  }
}
