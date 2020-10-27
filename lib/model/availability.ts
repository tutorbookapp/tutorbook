import { RRuleSet } from 'rrule';

import {
  DayAlias,
  Timeslot,
  TimeslotFirestore,
  TimeslotInterface,
  TimeslotJSON,
  TimeslotSearchHit,
  isTimeslotJSON,
} from 'lib/model/timeslot';
import { getDate } from 'lib/utils/time';

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
export type AvailabilityJSON = TimeslotJSON[];
export type AvailabilityFirestore = TimeslotFirestore[];
export type AvailabilitySearchHit = TimeslotSearchHit[];

export function isAvailabilityJSON(json: unknown): json is AvailabilityJSON {
  if (!(json instanceof Array)) return false;
  if (json.some((t) => !isTimeslotJSON(t))) return false;
  return true;
}

/**
 * Class that contains a bunch of time slots or openings that represents a
 * user's availability (inverse of their schedule, which contains a bunch of
 * booked time slots or appointments). This provides some useful methods for
 * finding time slots and a better `toString` representation than
 * `[Object object]`.
 */
export class Availability extends Array<Timeslot> implements AvailabilityAlias {
  private rruleset: RRuleSet = new RRuleSet();

  /**
   * Under the hood, I'm using `rrule` to take advantage of the recurrance rules
   * detailed in RFC 5545 and store a user's availability with the least amount
   * of data possible.
   * @return The `RRuleSet` that corresponds with this availability.
   */
  private get ruleset(): RRuleSet {
    if (this.rruleset.rrules.length === this.length) return this.rruleset;
    this.forEach((timeslot) => this.rruleset.rrule(timeslot.rrule));
    return this.rruleset;
  }

  /**
   * Returns a "full" availability (everyday, from 12am to 11pm). This is the
   * default for new tutors and when sending requests. This ignores the date
   * information and is only useful operating on times and weekdays.
   * @deprecated I'm not sure where I would need to use this, but whereever I do
   * it should be removed.
   */
  public static full(): Availability {
    const full = new Availability();
    Array(7)
      .fill(null)
      .forEach((_: null, day: number) => {
        const start = getDate(day as DayAlias, 0);
        const weekday = (day === 6 ? 0 : day + 1) as DayAlias;
        let end = getDate(weekday, 0);
        while (start.valueOf() > end.valueOf()) {
          end = new Date(end.valueOf() + 86400000 * 7);
        }
        full.push(new Timeslot(start, end));
      });
    return full;
  }

  /**
   * Returns whether or not there is any availability on a given date.
   * @param date - The JavaScript `Date` object from which we determine the
   * date (e.g. 1st or 31st), month, and year.
   * @param [duration] - The minimum duration of an open timeslot for there to
   * be considered "availability" on the given date in milliseconds.
   * @return Whether or not there is any available on the given date.
   */
  public hasDate(date: Date, duration = 18e5): boolean {
    console.log(`Checking if availability has date (${date.toString()})...`);
    return true;
    //const timeslot = new Timeslot(date, new Date(date.valueOf() + duration));
    //return this.contains(timeslot);
  }

  /**
   * Returns the timeslots (of a requested duration) that are available on a
   * given date.
   * @param date - The JavaScript `Date` object from which we determine the
   * date (e.g. 1st or 31st), month, and year.
   * @param [duration] - The timeslot duration in milliseconds; default 30 mins.
   * @return An array of timeslots of the requested duration that are available
   * on the given date.
   */
  public onDate(date: Date, duration = 18e5): Availability {
    console.log(`Collecting open timeslots for date (${date.toString()})...`);
    // Construct an array of 15min time increments (12am, 12:15am . . . 11:45pm)
    // that occur on the given date and are within this availability.
    const timeslots = Array(24 * 4)
      .fill(null)
      .map((_, idx) => {
        const hour = Math.floor(idx / 4);
        const mins = [0, 15, 30, 45][idx % 4];
        const from = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
          hour,
          mins
        );
        const to = new Date(from.valueOf() + duration);
        return new Timeslot(from, to);
      })
      .filter((timeslot) => this.contains(timeslot));
    return new Availability(...timeslots);
  }

  /**
   * Returns whether or not this availability contains the exact given timeslot.
   * @deprecated I'm not sure where I would need to use this, but whereever I do
   * it should be removed.
   */
  public hasTimeslot(timeslot: TimeslotInterface): boolean {
    return !!this.filter((t) => t.equalTo(timeslot)).length;
  }

  /**
   * Returns whether there is availability during a given timeslot.
   * @param timeslot - The timeslot to verify is in this availability.
   * @return Whether *any* timeslot in this availability contains the given
   * timeslot.
   * @deprecated I'm not sure where I would need to use this, but whereever I do
   * it should be removed.
   */
  public contains(timeslot: Timeslot): boolean {
    console.log('Checking if availability contains timeslot...', timeslot);
    return true;
    //const closestFrom = this.ruleset.before(timeslot.from, true);
    //return (
    //closestFrom.valueOf() <= timeslot.from.valueOf() &&
    //closestFrom.valueOf() + 18e5 >= timeslot.to.valueOf()
    //);
  }

  /**
   * Removes a given timeslot from this availability.
   * @param timeslot - The timeslot to remove from this availability (i.e. a
   * timeslot in which the user is now booked).
   * @return Nothing; modifies the existing availability object to ensure there
   * are no timeslots that overlap with the given timeslot.
   */
  public remove(timeslot: Timeslot): void {
    const a = new Timeslot(timeslot.from, timeslot.to, timeslot.recur);
    const updated = new Availability();
    const aFrom = a.from.valueOf();
    const aTo = a.to.valueOf();
    this.forEach((b: Timeslot) => {
      // A is the given timeslot and B is a timeslot in this availability.
      const bFrom = b.from.valueOf();
      const bTo = b.to.valueOf();
      if (bFrom < aFrom && bTo < aTo && bTo > aFrom) {
        // 1. If (they overlap; B's close time is contained w/in A):
        // - B's open time is before A's open time AND;
        // - B's close time is before A's close time AND;
        // - B's close time is after A's open time.
        // Adjust B such that its close time is equal to A's open time.
        updated.push(new Timeslot(b.from, new Date(aFrom), b.recur));
      } else if (bTo > aTo && bFrom < aTo && bFrom > aFrom) {
        // 2. If (B's open time is contained w/in A; opposite of scenario #1):
        // - B's close time is after A's close time AND;
        // - B's open time is before A's close time AND;
        // - B's open time is after A's open time.
        // Adjust B such that its open time is equal to A's close time.
        updated.push(new Timeslot(new Date(aTo), b.to, b.recur));
      } else if (a.contains(b)) {
        // 3. If (A contains B):
        // - B's open time is after A's open time AND;
        // - B's close time is before A's close time.
        // Remove B altogether (by not adding it to `updated`).
      } else if (b.contains(a)) {
        // 4. If (B contains A; opposite of scenario #2):
        // - B's open time is before A's open time AND;
        // - B's close time is after A's close time.
        // Split B into two timeslots (i.e. essentially cutting out A):
        // - One timeslot will be `{ from: B.from, to: A.from }`
        // - The other timeslot will be `{ from: A.to, to: B.to }`
        updated.push(new Timeslot(new Date(bFrom), new Date(aFrom)));
        updated.push(new Timeslot(new Date(aTo), new Date(bTo)));
      } else if (a.equalTo(b)) {
        // 5. If B and A are equal, we just remove B altogether (by not adding
        // it to `updated`).
      } else {
        // 6. Otherwise, we keep B and continue to the next check.
        updated.push(b);
      }
    });
    this.length = 0;
    updated.forEach((time: Timeslot) => this.push(time));
  }

  /**
   * Returns whether two availabilities contain all the same timeslots.
   * @param other - The other availability to check against.
   * @return Whether this availability contained all the same timeslots as the
   * other availability.
   * @deprecated We should just use a `dequal` which should do the same thing.
   */
  public equalTo(other: Availability): boolean {
    if (!other.every((t: Timeslot) => this.hasTimeslot(t))) return false;
    if (!this.every((t: Timeslot) => other.hasTimeslot(t))) return false;
    return true;
  }

  /**
   * Converts this `Availability` into a comma-separated string of all of it's
   * constituent timeslots.
   * @deprecated We're going to put these into strings within the React tree so
   * that we can use `react-intl` for better i18n support (e.g. we'll set the
   * localization in the `pages/_app.tsx` top-level component and all children
   * components will render their `Date`s properly for that locale).
   */
  public toString(showDay = true): string {
    return this.length > 0
      ? this.map((timeslot: Timeslot) => timeslot.toString(showDay)).join(', ')
      : '';
  }

  public toFirestore(): AvailabilityFirestore {
    return Array.from(this.map((timeslot: Timeslot) => timeslot.toFirestore()));
  }

  public static fromFirestore(data: AvailabilityFirestore): Availability {
    const availability: Availability = new Availability();
    data.forEach((t) => availability.push(Timeslot.fromFirestore(t)));
    return availability;
  }

  public toJSON(): AvailabilityJSON {
    return Array.from(this.map((timeslot: Timeslot) => timeslot.toJSON()));
  }

  public static fromJSON(json: AvailabilityJSON): Availability {
    const availability: Availability = new Availability();
    json.forEach((t) => availability.push(Timeslot.fromJSON(t)));
    return availability;
  }

  public static fromSearchHit(hit: AvailabilitySearchHit): Availability {
    const availability: Availability = new Availability();
    hit.forEach((t) => availability.push(Timeslot.fromSearchHit(t)));
    return availability;
  }

  public toURLParam(): string {
    return encodeURIComponent(JSON.stringify(this));
  }

  public static fromURLParam(param: string): Availability {
    const availability: Availability = new Availability();
    const params: string[] = JSON.parse(decodeURIComponent(param)) as string[];
    params.forEach((timeslotParam: string) => {
      availability.push(Timeslot.fromURLParam(timeslotParam));
    });
    return availability;
  }
}
