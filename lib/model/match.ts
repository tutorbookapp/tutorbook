import * as admin from 'firebase-admin';

import { v4 as uuid } from 'uuid';

import { ObjectWithObjectID } from '@algolia/client-search';
import { User, Aspect } from './user';
import {
  Availability,
  AvailabilityJSON,
  AvailabilitySearchHit,
} from './availability';

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
 * Represents an person to an appointment.
 * @property id - The user's unique Firebase-assigned user ID (note that this
 * contains both lowercase and capital letters which is why it can't be used as
 * a unique anonymous email address handle).
 * @property handle - The user's all-lowercase anonymous email handle.
 * @property roles - The user's roles at this appointment (e.g. tutor or pupil).
 */
export interface Person {
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
 * @property people - People who will be present during the appointment
 * (i.e. students, their parents and their tutor).
 * @property creator - Person who created the appointment (typically the student
 * but it could be their parent or an org admin).
 * @property message - Initial message sent by the match creator.
 * @property [times] - Timeslots when the appointment will occur. For now, each
 * of these timeslots has the default weekly recurrance.
 * @property [bramble] - The URL to the Bramble virtual tutoring room (only
 * populated when the match is for tutoring).
 * @property [jitsi] - The URL to the Jitsi video conferencing room (only
 * populated when the match is for mentoring).
 */
export interface MatchInterface {
  subjects: string[];
  people: Person[];
  creator: Person;
  message: string;
  times?: Availability;
  bramble?: Venue;
  jitsi?: Venue;
  ref?: DocumentReference;
  id: string;
}

export type MatchJSON = Omit<MatchInterface, 'times'> & {
  times?: AvailabilityJSON;
};

export type MatchSearchHit = ObjectWithObjectID &
  Omit<MatchInterface, 'times'> & { times?: AvailabilitySearchHit };

export class Match implements MatchInterface {
  public subjects: string[] = [];

  public people: Person[] = [];

  public creator: Person = { id: '', handle: uuid(), roles: [] };

  public message = '';

  public bramble?: Venue;

  public jitsi?: Venue;

  public ref?: DocumentReference;

  public times?: Availability;

  public id: string = '';

  /**
   * Wrap your boring `Record`s with this class to ensure that they have all of
   * the needed `MatchInterface` values (we fill any missing values w/
   * the above specified defaults) **and** to gain access to a bunch of useful
   * conversion method, etc (e.g. `toString` actually makes sense now).
   * @todo Actually implement a useful `toString` method here.
   * @todo Perhaps add an explicit check to ensure that the given `val`'s type
   * matches the default value at `this[key]`'s type; and then only update the
   * default value if the types match.
   */
  public constructor(match: Partial<MatchInterface> = {}) {
    construct<MatchInterface>(this, match);
  }

  public get aspect(): Aspect {
    const isTutor = (a: Person) => a.roles.indexOf('tutor') >= 0;
    const isTutee = (a: Person) => a.roles.indexOf('tutee') >= 0;
    if (this.people.some((a) => isTutor(a) || isTutee(a))) return 'tutoring';
    return 'mentoring';
  }

  public toJSON(): MatchJSON {
    const { times, ref, ...rest } = this;
    if (times) return { ...rest, times: times.toJSON() };
    return rest;
  }

  /**
   * Creates a new `Match` object given the JSON representation of it.
   * @todo Convert Firestore document `path`s to `DocumentReference`s.
   */
  public static fromJSON(json: MatchJSON): Match {
    const { times, ...rest } = json;
    if (times)
      return new Match({ ...rest, times: Availability.fromJSON(times) });
    return new Match(rest);
  }

  public toFirestore(): DocumentData {
    const { times, ref, id, ...rest } = this;
    if (times) return { ...rest, times: times.toFirestore() };
    return rest;
  }

  public static fromFirestore(snapshot: DocumentSnapshot): Match {
    const matchData: DocumentData | undefined = snapshot.data();
    if (matchData) {
      const { times, ...rest } = matchData;
      return new Match({
        ...rest,
        times: times ? Availability.fromFirestore(times) : undefined,
        ref: snapshot.ref,
        id: snapshot.id,
      });
    }
    console.warn(
      `[WARNING] Tried to create match (${snapshot.ref.id}) from ` +
        'non-existent Firestore document.'
    );
    return new Match();
  }

  public static fromSearchHit(hit: MatchSearchHit): Match {
    const { times, objectID, ...rest } = hit;
    return new Match({
      ...rest,
      times: times ? Availability.fromSearchHit(times) : undefined,
      id: objectID,
    });
  }
}
