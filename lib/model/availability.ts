import {
  DayAlias,
  Timeslot,
  TimeslotFirestore,
  TimeslotInterface,
  TimeslotJSON,
  TimeslotSearchHit,
  isTimeslotJSON,
} from 'lib/model/timeslot';
import { getDate, sameDate } from 'lib/utils/time';

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
 * Checks if a timeslot occurs on a given date.
 * @param timeslot - The timeslot to check.
 * @param date - The date which we expect the timeslot to be on.
 * @return Whether or not the timeslot occurs on the given date.
 */
export function timeslotOnDate(timeslot: Timeslot, date: Date): boolean {
  return sameDate(timeslot.from, date) && sameDate(timeslot.to, date);
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
   * Sorts this availability (in-place) from the earliest to the latest timeslot
   * start time and returns the sorted list.
   * @example
   * const avail = new Availability(future, past, now);
   * avail.sort(); // Returns [past, now, future] sort.
   */
  public sort(): this {
    return super.sort((timeslotA, timeslotB) => {
      return timeslotA.from.valueOf() - timeslotB.from.valueOf();
    });
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
        full.push(new Timeslot({ from: start, to: end }));
      });
    return full;
  }

  /**
   * Returns whether or not there is any availability on a given date.
   * @param date - The JavaScript `Date` object from which we determine the
   * date (e.g. 1st or 31st), month, and year.
   * @return Whether or not there is any available on the given date.
   */
  public hasDate(date: Date): boolean {
    return this.some((t) => timeslotOnDate(t, date));
  }

  /**
   * Returns the timeslots that are available on a given date.
   * @param date - The JavaScript `Date` object from which we determine the
   * date (e.g. 1st or 31st), month, and year.
   * @return An array of timeslots of the requested duration that are available
   * on the given date.
   */
  public onDate(date: Date): Availability {
    return new Availability(...this.filter((t) => timeslotOnDate(t, date)));
  }

  /**
   * Returns whether or not this availability contains the exact given timeslot.
   * @deprecated I'm not sure where I would need to use this, but whereever I do
   * it should be removed.
   */
  public hasTimeslot(timeslot: TimeslotInterface): boolean {
    return this.some((t) => t.equalTo(timeslot));
  }

  /**
   * Returns whether there is availability during a given timeslot.
   * @param timeslot - The timeslot to verify is in this availability.
   * @return Whether *any* timeslot in this availability contains the given
   * timeslot.
   * @deprecated I'm not sure where I would need to use this, but whereever I do
   * it should be removed.
   * @todo Account for recurrance rules.
   */
  public contains(timeslot: Timeslot): boolean {
    return this.some((t) => t.contains(timeslot));
  }

  /**
   * Removes a given timeslot from this availability.
   * @param timeslot - The timeslot to remove from this availability (i.e. a
   * timeslot in which the user is now booked).
   * @return Nothing; modifies the existing availability object to ensure there
   * are no timeslots that overlap with the given timeslot.
   */
  public remove(timeslot: Timeslot): void {
    const a = new Timeslot(timeslot);
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
        updated.push(new Timeslot({ ...b, to: new Date(aFrom) }));
      } else if (bTo > aTo && bFrom < aTo && bFrom > aFrom) {
        // 2. If (B's open time is contained w/in A; opposite of scenario #1):
        // - B's close time is after A's close time AND;
        // - B's open time is before A's close time AND;
        // - B's open time is after A's open time.
        // Adjust B such that its open time is equal to A's close time.
        updated.push(new Timeslot({ ...b, from: new Date(aTo) }));
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
        updated.push(
          new Timeslot({
            from: new Date(bFrom),
            to: new Date(aFrom),
          })
        );
        updated.push(
          new Timeslot({
            from: new Date(aTo),
            to: new Date(bTo),
          })
        );
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

  public toString(locale = 'en'): string {
    return this.map((t) => t.toString(locale)).join(', ');
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
