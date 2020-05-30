import { TimeUtils, Timeslot, TimeslotJSONInterface } from './times';
import * as admin from 'firebase-admin';
import * as firebase from 'firebase/app';
import 'firebase/firestore';

/**
 * Type aliases so that we don't have to type out the whole type. We could try
 * importing these directly from the `@firebase/firestore-types` or the
 * `@google-cloud/firestore` packages, but that's not recommended.
 * @todo Perhaps figure out a way to **only** import the type defs we need.
 */
type DocumentData = firebase.firestore.DocumentData;
type DocumentSnapshot = firebase.firestore.DocumentSnapshot;
type DocumentReference = firebase.firestore.DocumentReference;
type SnapshotOptions = firebase.firestore.SnapshotOptions;
type AdminDocumentSnapshot = admin.firestore.DocumentSnapshot;
type AdminDocumentReference = admin.firestore.DocumentReference;

export type ApptVenueTypeAlias = 'bramble';
export type RoleAlias = 'tutor' | 'tutee' | 'mentor' | 'mentee';

export interface AttendeeInterface {
  uid: string;
  roles: RoleAlias[];
}

/**
 * Right now, we only support one `ApptVenueType` via our
 * [Bramble]{@link https://about.bramble.io/api.html} integration.
 * @todo Add more supported venues like Zoom, Google Hangouts, or BigBlueButton.
 */
export interface ApptVenueInterface extends Record<string, any> {
  type: ApptVenueTypeAlias;
  url: string;
}

export interface ApptInterface {
  subjects: string[];
  attendees: AttendeeInterface[];
  time?: Timeslot;
  venues: ApptVenueInterface[];
  message?: string;
  ref?: DocumentReference | AdminDocumentReference;
  id?: string;
}

export interface ApptJSONInterface {
  subjects: string[];
  attendees: AttendeeInterface[];
  time?: TimeslotJSONInterface;
  message?: string;
  id?: string;
}

export class Appt implements ApptInterface {
  public message: string = '';
  public subjects: string[] = [];
  public attendees: AttendeeInterface[] = [];
  public venues: ApptVenueInterface[] = [];
  public ref?: DocumentReference | AdminDocumentReference;
  public time?: Timeslot;
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
    if (time) return { ...rest, time: time.toJSON() };
    return rest;
  }

  /**
   * Creates a new `Appt` object given the JSON representation of it.
   * @todo Convert Firestore document `path`s to `DocumentReference`s.
   */
  public static fromJSON(json: ApptJSONInterface): Appt {
    const { time, ...rest } = json;
    if (time) return new Appt({ ...rest, time: Timeslot.fromJSON(time) });
    return new Appt(rest);
  }

  public toFirestore(): DocumentData {
    const { time, ref, id, ...rest } = this;
    if (time) return { ...rest, time: time.toFirestore() };
    return rest;
  }

  public static fromFirestore(
    snapshot: DocumentSnapshot | AdminDocumentSnapshot,
    options?: SnapshotOptions
  ): Appt {
    const apptData: DocumentData | undefined = snapshot.data(options);
    if (apptData) {
      const { time, ...rest } = apptData;
      return new Appt({
        ...rest,
        time: time ? Timeslot.fromFirestore(time) : undefined,
        ref: snapshot.ref,
        id: snapshot.id,
      });
    } else {
      console.warn(
        `[WARNING] Tried to create appt (${snapshot.ref.id}) from ` +
          'non-existent Firestore document.'
      );
      return new Appt();
    }
  }
}
