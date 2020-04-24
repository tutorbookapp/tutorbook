import {
  DocumentData,
  DocumentReference,
  QueryDocumentSnapshot,
  SnapshotOptions,
} from '@firebase/firestore-types';
import { TimeUtils, Timeslot, TimeslotJSONInterface } from './times';

export type RoleAlias = 'tutor' | 'pupil';

export interface AttendeeInterface {
  uid: string;
  roles: RoleAlias[];
}

export interface ApptInterface {
  subjects: string[];
  attendees: AttendeeInterface[];
  time: Timeslot;
  message?: string;
  ref?: DocumentReference;
  id?: string;
}

export interface ApptJSONInterface {
  subjects: string[];
  attendees: AttendeeInterface[];
  time: TimeslotJSONInterface;
  message?: string;
  id?: string;
}

export class Appt implements ApptInterface {
  public message: string = '';
  public subjects: string[] = [];
  public attendees: AttendeeInterface[] = []; // TODO: Why is default time is 7-8am on Mondays?
  public time: Timeslot = new Timeslot(
    TimeUtils.getDate(1, 7),
    TimeUtils.getDate(1, 8)
  );
  public ref?: DocumentReference;
  public id?: string;

  /**
   * Wrap your boring `Record`s with this class to ensure that they have all of
   * the needed `ApptInterface` values (we fill any missing values w/
   * the above specified defaults) **and** to gain access to a bunch of useful
   * conversion method, etc (e.g. `toString` actually makes sense now).
   * @todo Actually implement a useful `toString` method here.
   * @todo Perhaps add an explicit check to ensure that the given `val`'s type
   * matches the default value at `this[key]`'s type; and then only update the
   * default value if the types match.
   */
  public constructor(request: Partial<ApptInterface> = {}) {
    Object.entries(request).map(([key, val]: [string, any]) => {
      if (val && key in this) (this as Record<string, any>)[key] = val;
    });
  }

  public toJSON(): ApptJSONInterface {
    const { time, ref, ...rest } = this;
    return { ...rest, time: time.toJSON() };
  }

  public static fromJSON(json: ApptJSONInterface): Appt {
    const { time, ...rest } = json;
    return new Appt({ ...rest, time: Timeslot.fromJSON(time) });
  }

  public toFirestore(): DocumentData {
    const { time, ref, id, ...rest } = this;
    return { ...rest, time: time.toFirestore() };
  }

  public static fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options?: SnapshotOptions
  ): Appt {
    const { time, ...rest } = snapshot.data(options);
    return new Appt({
      ...rest,
      time: Timeslot.fromFirestore(time),
      ref: snapshot.ref,
      id: snapshot.id,
    });
  }
}
