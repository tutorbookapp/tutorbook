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

type DocumentData = admin.firestore.DocumentData;
type DocumentSnapshot = admin.firestore.DocumentSnapshot;
type DocumentReference = admin.firestore.DocumentReference;

export type Role = 'parent' | 'tutor' | 'tutee' | 'mentor' | 'mentee';

export type UserWithRoles = User & { roles: Role[] };

/**
 * Represents a person that is involved in a request or match. Here, roles are
 * explicitly listed (unlike the `User` object where roles are implied by
 * role-specific properties).
 * @property id - The user's unique Firebase-assigned user ID (note that this
 * contains both lowercase and capital letters which is why it can't be used as
 * a unique anonymous email address handle).
 * @property handle - The user's all-lowercase anonymous email handle.
 * @property roles - The user's roles in this request or match (e.g. `tutor`).
 */
export interface Person {
  id: string;
  handle: string;
  roles: Role[];
}

/**
 * A request is a job post. Typically created by parents or teachers.
 * @property people - Student(s) who need help (e.g. "Nicholas Chiang").
 * @property subjects - What the student needs help with (e.g. "AP CS A").
 * @property creator - Person who created the request (typically a parent or
 * teacher but it could also be an admin or the student themselves).
 * @property message - What specifically the student is struggling with (e.g.
 * "Nicholas doesn't understand Java arrays and sorting algorithms").
 * @property [times] - Requested timeslots when (tutoring/mentoring) meetings
 * should occur (i.e. the times that work best for the student). For now, each
 * of these timeslots has the default weekly recurrance.
 */
export interface RequestInterface {
  subjects: string[];
  people: Person[];
  creator: Person;
  message: string;
  times?: Availability;
  ref?: DocumentReference;
  id: string;
}

export type RequestJSON = Omit<RequestInterface, 'times'> & {
  times?: AvailabilityJSON;
};

export type RequestSearchHit = ObjectWithObjectID &
  Omit<RequestInterface, 'times'> & { times?: AvailabilitySearchHit };

export class Request implements RequestInterface {
  public subjects: string[] = [];

  public people: Person[] = [];

  public creator: Person = { id: '', handle: uuid(), roles: [] };

  public message = '';

  public times?: Availability;

  public ref?: DocumentReference;

  public id: string = '';

  public constructor(request: Partial<RequestInterface> = {}) {
    construct<RequestInterface>(this, request);
  }

  public get aspect(): Aspect {
    const isTutor = (a: Person) => a.roles.indexOf('tutor') >= 0;
    const isTutee = (a: Person) => a.roles.indexOf('tutee') >= 0;
    if (this.people.some((a) => isTutor(a) || isTutee(a))) return 'tutoring';
    return 'mentoring';
  }

  public toJSON(): RequestJSON {
    const { times, ref, ...rest } = this;
    if (times) return { ...rest, times: times.toJSON() };
    return rest;
  }

  public static fromJSON(json: RequestJSON): Request {
    const { times, ...rest } = json;
    if (times)
      return new Request({ ...rest, times: Availability.fromJSON(times) });
    return new Request(rest);
  }

  public toFirestore(): DocumentData {
    const { times, ref, id, ...rest } = this;
    if (times) return { ...rest, times: times.toFirestore() };
    return rest;
  }

  public static fromFirestore(snapshot: DocumentSnapshot): Request {
    const requestData: DocumentData | undefined = snapshot.data();
    if (requestData) {
      const { times, ...rest } = requestData;
      return new Request({
        ...rest,
        times: times ? Availability.fromFirestore(times) : undefined,
        ref: snapshot.ref,
        id: snapshot.id,
      });
    }
    console.warn(
      `[WARNING] Tried to create request (${snapshot.ref.id}) from ` +
        'non-existent Firestore document.'
    );
    return new Request();
  }

  public static fromSearchHit(hit: RequestSearchHit): Request {
    const { times, objectID, ...rest } = hit;
    return new Request({
      ...rest,
      times: times ? Availability.fromSearchHit(times) : undefined,
      id: objectID,
    });
  }
}
