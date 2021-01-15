import * as admin from 'firebase-admin';

import { isDateJSON, isJSON } from 'lib/model/json';
import clone from 'lib/utils/clone';
import construct from 'lib/model/construct';

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
 * @property id - A unique identifier for this timeslot (used as React keys and
 * thus only stored client-side as we have no use for this on our server).
 * @property [recur] - The recurrance of this timeslot as specified in
 * [RFC 5545]{@link https://tools.ietf.org/html/rfc5545#section-3.8.5}. The
 * DTSTART is ignored as it should always be the `from` value. Default value is
 * always weekly.
 * @property from - The start time and date of this timeslot (typically
 * represented by a `Date`, `Timestamp`, or UTC date string).
 * @property to - The end time and date of this timeslot (represented in the
 * same format as the `from` property).
 */
export interface TimeslotBase<T> {
  id: string;
  recur: string;
  from: T;
  to: T;
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
export type TimeslotSegment = { from: Date; to: Date };

export function isTimeslotJSON(json: unknown): json is TimeslotJSON {
  if (!isJSON(json)) return false;
  if (!isDateJSON(json.from)) return false;
  if (!isDateJSON(json.to)) return false;
  if (typeof json.id !== 'string') return false;
  if (typeof json.recur !== 'string') return false;
  return true;
}

export class Timeslot implements TimeslotInterface {
  public id = '';

  public recur = 'RRULE:FREQ=WEEKLY';

  public from: Date = new Date();

  public to: Date = new Date();

  /**
   * Constructor that takes advantage of Typescript's shorthand assignment.
   * @see {@link https://bit.ly/2XjNmB5}
   */
  public constructor(timeslot: Partial<TimeslotInterface> = {}) {
    construct<TimeslotInterface>(this, timeslot);
  }

  public get clone(): Timeslot {
    return new Timeslot(clone(this));
  }

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
   * @return Whether or not this timeslot overlaps with the given timeslot:
   * 1. (Contained) Timeslot contains the given timeslot, OR;
   * 2. (Overlap Start) Timeslot contains the given timeslot's start time, OR;
   * 3. (Overlap End) Timeslot contains the given timeslot's end time.
   */
  public overlaps(other: { from: Date; to: Date }): boolean {
    return (
      this.contains(other) ||
      this.contains({ from: other.from, to: other.from }) ||
      this.contains({ from: other.to, to: other.to })
    );
  }

  /**
   * Returns whether or not this timeslot contains the given timeslot.
   * @param other - The timeslot to check is within this timeslot.
   * @return Whether the starting time of this timeslot is before the starting
   * time of the other timeslot AND the ending time of this timeslot is after
   * the ending time of the other timeslot.
   * @todo Account for recurrance rules.
   */
  public contains(other: { from: Date; to: Date }): boolean {
    return (
      this.from.valueOf() <= other.from.valueOf() &&
      this.from.valueOf() + this.duration >= other.to.valueOf()
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

  public toNextWeek(): Timeslot {
    const from = new Date(this.from.valueOf());
    const to = new Date(this.to.valueOf());
    from.setDate(from.getDate() + 7);
    to.setDate(to.getDate() + 7);
    return new Timeslot({ ...this, from, to });
  }

  public toString(locale = 'en', showTimeZone = true): string {
    const showSecondDate =
      this.from.getDate() !== this.to.getDate() ||
      this.from.getMonth() !== this.to.getMonth() ||
      this.from.getFullYear() !== this.to.getFullYear();
    return `${this.from.toLocaleString(locale, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    })} - ${this.to.toLocaleString(locale, {
      weekday: showSecondDate ? 'long' : undefined,
      month: showSecondDate ? 'long' : undefined,
      day: showSecondDate ? 'numeric' : undefined,
      hour: 'numeric',
      minute: 'numeric',
      timeZoneName: showTimeZone ? 'short' : undefined,
    })}`;
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
    return new Timeslot({
      ...data,
      from: data.from.toDate(),
      to: data.to.toDate(),
    });
  }

  public toJSON(): TimeslotJSON {
    const { from, to, ...rest } = this;
    return { ...rest, from: from.toJSON(), to: to.toJSON() };
  }

  public static fromJSON(json: TimeslotJSON): Timeslot {
    return new Timeslot({
      ...json,
      from: new Date(json.from),
      to: new Date(json.to),
    });
  }

  public toSearchHit(): TimeslotSearchHit {
    const { from, to, ...rest } = this;
    return { ...rest, from: from.valueOf(), to: to.valueOf() };
  }

  public static fromSearchHit(hit: TimeslotSearchHit): Timeslot {
    return new Timeslot({
      ...hit,
      from: new Date(hit.from),
      to: new Date(hit.to),
    });
  }

  public toURLParam(): string {
    return encodeURIComponent(JSON.stringify(this));
  }

  public static fromURLParam(param: string): Timeslot {
    const params: URLSearchParams = new URLSearchParams(param);
    return new Timeslot({
      from: new Date(params.get('from') as string),
      to: new Date(params.get('to') as string),
      recur: params.get('recur') || undefined,
      id: params.get('id') || undefined,
    });
  }

  public toSegment(): TimeslotSegment {
    return { from: this.from, to: this.to };
  }
}
