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

  public static fromFirestore(data: TimeslotInterface): Timeslot {
    return new Timeslot(data.from, data.to);
  }

  public toFirestore(): TimeslotInterface {
    return { from: this.from, to: this.to };
  }
}

/**
 * Class that contains a bunch of time slots or openings that represents a
 * user's availability (inverse of their schedule, which contains a bunch of
 * booked time slots or appointments). This provides some useful methods for
 * finding time slots and a better `toString` representation than
 * `[Object object]`.
 */
export class Availability extends Array<Timeslot> implements AvailabilityAlias {
  public toString() {
    return this.length > 0
      ? this.map((timeslot) => timeslot.toString(true)).join(', ')
      : '';
  }

  public hasTimeslot(timeslot: TimeslotInterface): boolean {
    return !!this.filter((t) => t.equalTo(timeslot)).length;
  }

  public static fromFirestore(data: Array<TimeslotInterface>): Availability {
    const availability: Availability = new Availability();
    data.map((timeslot) => availability.push(Timeslot.fromFirestore(timeslot)));
    return availability;
  }

  public toFirestore(): Array<TimeslotInterface> {
    return this.map((timeslot) => timeslot.toFirestore());
  }
}
