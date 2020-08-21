import * as admin from 'firebase-admin';
import { v4 as uuid } from 'uuid';
import { ObjectWithObjectID } from '@algolia/client-search';

import { Aspect } from '../user';
import {
  Availability,
  AvailabilityJSON,
  AvailabilitySearchHit,
} from '../availability';
import construct from '../construct';

import { Person } from './shared';

type DocumentData = admin.firestore.DocumentData;
type DocumentReference = admin.firestore.DocumentReference;

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

  public creator: Person = {
    id: '',
    name: '',
    photo: '',
    handle: uuid(),
    roles: [],
  };

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
