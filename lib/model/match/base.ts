import * as admin from 'firebase-admin';
import { v4 as uuid } from 'uuid';
import { ObjectWithObjectID } from '@algolia/client-search';

import { Aspect, User } from '../user';
import {
  Availability,
  AvailabilityJSON,
  AvailabilitySearchHit,
} from '../availability';
import construct from '../construct';

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

export interface BaseInterface {
  subjects: string[];
  people: Person[];
  creator: Person;
  message: string;
  times?: Availability;
  ref?: DocumentReference;
  id: string;
}

export type BaseJSON = Omit<BaseInterface, 'times'> & {
  times?: AvailabilityJSON;
};

export type BaseSearchHit = ObjectWithObjectID &
  Omit<BaseInterface, 'times'> & { times?: AvailabilitySearchHit };

// TODO: Why can't I use the `static` modifier with the `abstract` modifier? I
// want to be able to create a super `Base` data model class that ensures each
// data model class includes certain transformation functions (e.g. `fromJSON`).
export abstract class Base implements BaseInterface {
  public subjects: string[] = [];

  public people: Person[] = [];

  public creator: Person = { id: '', handle: uuid(), roles: [] };

  public message = '';

  public times?: Availability;

  public ref?: DocumentReference;

  public id = '';

  public constructor(request: Partial<BaseInterface> = {}) {
    construct<BaseInterface>(this, request);
  }

  public get aspect(): Aspect {
    const isTutor = (a: Person) => a.roles.indexOf('tutor') >= 0;
    const isTutee = (a: Person) => a.roles.indexOf('tutee') >= 0;
    if (this.people.some((a) => isTutor(a) || isTutee(a))) return 'tutoring';
    return 'mentoring';
  }

  public abstract toJSON(): BaseJSON;

  public abstract toFirestore(): DocumentData;
}
