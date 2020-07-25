import * as admin from 'firebase-admin';

import { v4 as uuid } from 'uuid';

import { ObjectWithObjectID } from '@algolia/client-search';
import { User, Aspect } from './user';
import { Timeslot, TimeslotJSON, TimeslotSearchHit } from './timeslot';

import construct from './construct';

/**
 * Type aliases so that we don't have to type out the whole type. We could try
 * importing these directly from the `@firebase/firestore-types` or the
 * `@google-cloud/firestore` packages, but that's not recommended.
 * @todo Perhaps figure out a way to **only** import the type defs we need.
 */
type DocumentData = admin.firestore.DocumentData;
type DocumentSnapshot = admin.firestore.DocumentSnapshot;
type DocumentReference = admin.firestore.DocumentReference;

export type Role = 'parent' | 'tutor' | 'tutee' | 'mentor' | 'mentee';

export type UserWithRoles = User & { roles: Role[] };

/**
 * Represents an attendee to an appointment.
 * @property id - The user's unique Firebase-assigned user ID (note that this
 * contains both lowercase and capital letters which is why it can't be used as
 * a unique anonymous email address handle).
 * @property handle - The user's all-lowercase anonymous email handle.
 * @property roles - The user's roles at this appointment (e.g. tutor or pupil).
 */
export interface Attendee {
  id: string;
  handle: string;
  roles: Role[];
}

export interface Venue {
  url: string;
}

/**
 * Represents a tutoring lesson or mentoring appointment.
 * @property subjects - Subjects the appointment will be about (e.g. CS).
 * @property attendees - People who will be present during the appointment
 * (i.e. students, their parents and their tutor).
 * @property creator - Person who created the appointment (typically the student
 * but it could be their parent or an org admin).
 * @property message - Initial message sent by the appt creator.
 * @property [time] - Timeslot when the appointment will occur.
 * @property [bramble] - The URL to the Bramble virtual tutoring room (only
 * populated when the appt is for tutoring).
 * @property [jitsi] - The URL to the Jitsi video conferencing room (only
 * populated when the appt is for mentoring).
 */
export interface ApptInterface {
  subjects: string[];
  attendees: Attendee[];
  creator: Attendee;
  message: string;
  time?: Timeslot;
  bramble?: Venue;
  jitsi?: Venue;
  ref?: DocumentReference;
  id: string;
}

export type ApptJSON = Omit<ApptInterface, 'time'> & { time?: TimeslotJSON };

export type ApptSearchHit = ObjectWithObjectID &
  Omit<ApptInterface, 'time'> & { time?: TimeslotSearchHit };

export class Appt implements ApptInterface {
  public subjects: string[] = [];

  public attendees: Attendee[] = [];

  public creator: Attendee = { id: '', handle: uuid(), roles: [] };

  public message = '';

  public bramble?: Venue;

  public jitsi?: Venue;

  public ref?: DocumentReference;

  public time?: Timeslot;

  public id: string = '';

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
  public constructor(appt: Partial<ApptInterface> = {}) {
    construct<ApptInterface>(this, appt);
  }

  public get aspect(): Aspect {
    const isTutor = (a: Attendee) => a.roles.indexOf('tutor') >= 0;
    const isTutee = (a: Attendee) => a.roles.indexOf('tutee') >= 0;
    if (this.attendees.some((a) => isTutor(a) || isTutee(a))) return 'tutoring';
    return 'mentoring';
  }

  public toJSON(): ApptJSON {
    const { time, ref, ...rest } = this;
    if (time) return { ...rest, time: time.toJSON() };
    return rest;
  }

  /**
   * Creates a new `Appt` object given the JSON representation of it.
   * @todo Convert Firestore document `path`s to `DocumentReference`s.
   */
  public static fromJSON(json: ApptJSON): Appt {
    const { time, ...rest } = json;
    if (time) return new Appt({ ...rest, time: Timeslot.fromJSON(time) });
    return new Appt(rest);
  }

  public toFirestore(): DocumentData {
    const { time, ref, id, ...rest } = this;
    if (time) return { ...rest, time: time.toFirestore() };
    return rest;
  }

  public static fromFirestore(snapshot: DocumentSnapshot): Appt {
    const apptData: DocumentData | undefined = snapshot.data();
    if (apptData) {
      const { time, ...rest } = apptData;
      return new Appt({
        ...rest,
        time: time ? Timeslot.fromFirestore(time) : undefined,
        ref: snapshot.ref,
        id: snapshot.id,
      });
    }
    console.warn(
      `[WARNING] Tried to create appt (${snapshot.ref.id}) from ` +
        'non-existent Firestore document.'
    );
    return new Appt();
  }

  public static fromSearchHit(hit: ApptSearchHit): Appt {
    const { time, objectID, ...rest } = hit;
    return new Appt({
      ...rest,
      time: typeof time === 'undefined' ? time : Timeslot.fromSearchHit(time),
      id: objectID,
    });
  }
}
