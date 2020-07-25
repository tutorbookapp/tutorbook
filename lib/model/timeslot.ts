import * as admin from 'firebase-admin';

import { TimeUtils } from 'lib/utils';
import { DAYS } from './constants';

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

export interface TimeslotBase<T> {
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

/**
 * Class that represents a time opening or slot where tutoring can take place
 * (or where tutoring is taking place in the case of a booking). This provides
 * some useful methods for comparison and a better `toString` representation
 * than `[Object object]`.
 */
export class Timeslot implements TimeslotBase<Date> {
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

  /**
   * Parses an input (see below for examples) into a `Timeslot`:
   * > Mondays at 3:00 PM to 4:00 PM.
   * > Monday at 3:00 PM to 3:30 PM.
   * This getter should only ever be called within a `try{} catch {}` sequence
   * b/c it will throw an error every time if `this.state.value` isn't parsable.
   * @deprecated We're going to put these into strings within the React tree so
   * that we can use `react-intl` for better i18n support (e.g. we'll set the
   * localization in the `pages/_app.tsx` top-level component and all children
   * components will render their `Date`s properly for that locale).
   */
  public static fromString(timeslot: string): Timeslot {
    const split: string[] = timeslot.split(' ');
    if (split.length !== 7) throw new Error('Invalid time string.');

    const dayStr: string = split[0];
    const fromStr: string = split[2];
    const fromAMPM: string = split[3];
    const toStr: string = split[5];
    const toAMPM: string = split[6];

    const day: keyof typeof Day = (dayStr.endsWith('s')
      ? dayStr.slice(0, -1)
      : dayStr) as keyof typeof Day;
    const dayNum: DayAlias = Day[day];

    let fromHr: number = Number(fromStr.split(':')[0]).valueOf();
    const fromMin: number = Number(fromStr.split(':')[1]).valueOf();
    if (fromAMPM === 'PM') {
      fromHr += 12;
    } else if (fromAMPM !== 'AM') {
      throw new Error('Invalid AM/PM format for from time.');
    }

    let toHr: number = Number(toStr.split(':')[0]).valueOf();
    const toMin: number = Number(toStr.split(':')[1]).valueOf();
    if (toAMPM === 'PM' || toAMPM === 'PM.') {
      toHr += 12;
    } else if (toAMPM !== 'AM' && toAMPM !== 'AM.') {
      throw new Error('Invalid AM/PM format for to time.');
    }

    return new Timeslot(
      TimeUtils.getDate(dayNum, fromHr, fromMin),
      TimeUtils.getDate(dayNum, toHr, toMin)
    );
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
      `${`0${this.from.getMinutes()}`.slice(-2)} AM to ` +
      `${this.to.getHours()}:${`0${this.to.getMinutes()}`.slice(-2)} AM`
    );
  }

  public equalTo(timeslot: TimeslotInterface): boolean {
    return (
      timeslot.from.valueOf() === this.from.valueOf() &&
      timeslot.to.valueOf() === this.to.valueOf()
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
    return {
      from: (this.from as unknown) as Timestamp,
      to: (this.to as unknown) as Timestamp,
    };
  }

  /**
   * Takes in a Firestore timeslot record and returns a new `Timeslot` object.
   */
  public static fromFirestore(data: TimeslotFirestore): Timeslot {
    return new Timeslot(data.from.toDate(), data.to.toDate());
  }

  public toJSON(): TimeslotJSON {
    return { from: this.from.toJSON(), to: this.to.toJSON() };
  }

  public static fromJSON(json: TimeslotJSON): Timeslot {
    return new Timeslot(new Date(json.from), new Date(json.to));
  }

  public static fromSearchHit(hit: TimeslotSearchHit): Timeslot {
    return new Timeslot(new Date(hit.from), new Date(hit.to));
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
