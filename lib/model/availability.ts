import {
  isTimeslotJSON,
  DayAlias,
  Timeslot,
  TimeslotFirestore,
  TimeslotInterface,
  TimeslotJSON,
  TimeslotSearchHit,
} from 'lib/model/timeslot';
import { TimeUtils } from 'lib/utils';

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
  /**
   * Returns a "full" availability (everyday, from 12am to 11pm). This is the
   * default for new tutors and when sending requests. This ignores the date
   * information and is only useful operating on times and weekdays.
   */
  public static full(): Availability {
    const full = new Availability();
    Array(7)
      .fill(null)
      .forEach((_: null, day: number) => {
        const start = TimeUtils.getDate(day as DayAlias, 0);
        const weekday = (day === 6 ? 0 : day + 1) as DayAlias;
        let end = TimeUtils.getDate(weekday, 0);
        while (start.valueOf() > end.valueOf()) {
          end = new Date(end.valueOf() + 86400000 * 7);
        }
        full.push(new Timeslot(start, end));
      });
    return full;
  }

  /**
   * Note that this method (`Availability.prototype.contains`) is **very**
   * different from the `Availability.prototype.hasTimeslot` method; this method
   * checks to see if any `Timeslot` contains the given `Timeslot` whereas the
   * `hasTimeslot` methods checks to see if this availability contains the exact
   * given `Timeslot`.
   */
  public contains(other: Timeslot): boolean {
    const contains = (a: boolean, t: Timeslot) => a || t.contains(other);
    return this.reduce(contains, false);
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
    this.forEach((b: Timeslot) => {
      /* eslint-disable no-param-reassign */
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
      /* eslint-enable no-param-reassign */
    });
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
  public toString(showDay = true): string {
    return this.length > 0
      ? this.map((timeslot: Timeslot) => timeslot.toString(showDay)).join(', ')
      : '';
  }

  public hasTimeslot(timeslot: TimeslotInterface): boolean {
    return !!this.filter((t) => t.equalTo(timeslot)).length;
  }

  public toFirestore(): AvailabilityFirestore {
    return Array.from(this.map((timeslot: Timeslot) => timeslot.toFirestore()));
  }

  /**
   * Takes in an array of `Timeslot` objects (but w/ Firestore `Timestamp`
   * objects in the `from` and `to` fields instead of `Date` objects) and
   * returns an `Availability` object.
   */
  public static fromFirestore(data: AvailabilityFirestore): Availability {
    const availability: Availability = new Availability();
    data.forEach((t) => availability.push(Timeslot.fromFirestore(t)));
    return availability;
  }

  /**
   * Returns a basic `Array` object containing `TimeslotJSON`s. Note
   * that we **must** wrap the `this.map` statement with an `Array.from` call
   * because otherwise, we'd just return an invalid `Availability` object (which
   * would cause subsequent `toJSON` calls to fail because the new array
   * wouldn't contain valid `Timeslot` objects).
   */
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

  /**
   * Checks if two availabilities contain all the same timeslots by ensuring
   * that:
   * 1. This availability contains all the timeslots of the other availability.
   * 2. The other availability contains all the timeslots of this availability.
   */
  public equalTo(other: Availability): boolean {
    if (!other.every((t: Timeslot) => this.hasTimeslot(t))) return false;
    if (!this.every((t: Timeslot) => other.hasTimeslot(t))) return false;
    return true;
  }
}
