import * as admin from 'firebase-admin';

import { DAYS } from './constants';
import isJSON from './is-json';

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

/**
 * Class that represents a time opening or slot where tutoring can take place
 * (or where tutoring is taking place in the case of a booking). This provides
 * some useful methods for comparison and a better `toString` representation
 * than `[Object object]`.
 */
export class Timeslot implements TimeslotBase<Date> {
  public recur = 'RRULE:FREQ=WEEKLY';

  /**
   * Constructor that takes advantage of Typescript's shorthand assignment.
   * @see {@link https://bit.ly/2XjNmB5}
   */
  public constructor(public from: Date, public to: Date, recur?: string) {
    if (recur) this.recur = recur;
  }

  /**
   * Returns if this timeslot contains another timeslot (i.e. the starting time
   * of the other timeslot is equal to or after the starting time of this
   * timeslot **and** the ending time of the other timeslot is equal to or
   * before the ending time of this timeslot).
   * @todo Check the `recur` value as well.
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

  public equalTo(timeslot: TimeslotInterface): boolean {
    return (
      timeslot.recur === this.recur &&
      timeslot.to.valueOf() === this.to.valueOf() &&
      timeslot.from.valueOf() === this.from.valueOf()
    );
  }

  /**
   * Converts this object into a `TimeslotFirestoreI` (i.e. instead of `Date`s
   * we use `Timestamp`s).
   * @todo Right now, this isn't really doing anything besides some sketchy
   * type assertions b/c the Firebase Admin Node.js SDK `Timestamp` type doesn't
   * match the client-side `firebase/app` library `Timestamp` type. We want to
   * somehow return a `Timestamp` type that can be used by both (but I can't
   * figure out how to do this, so I'm just returning `Date`s which are
   * converted into the *correct* `Timestamp` type by the Firebase SDK itself).
   */
  public toFirestore(): TimeslotFirestore {
    const { from, to, ...rest } = this;
    return {
      ...rest,
      from: (from as unknown) as Timestamp,
      to: (to as unknown) as Timestamp,
    };
  }

  /**
   * Takes in a Firestore timeslot record and returns a new `Timeslot` object.
   */
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
