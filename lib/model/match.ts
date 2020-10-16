import * as admin from 'firebase-admin';
import { ObjectWithObjectID } from '@algolia/client-search';
import { nanoid } from 'nanoid';
import { v4 as uuid } from 'uuid';

import {
  Availability,
  AvailabilityJSON,
  AvailabilitySearchHit,
  isAvailabilityJSON,
} from 'lib/model/availability';
import { Aspect } from 'lib/model/aspect';
import { Resource } from 'lib/model/resource';
import { User } from 'lib/model/user';
import construct from 'lib/model/construct';
import firestoreVals from 'lib/model/firestore-vals';
import isJSON from 'lib/model/is-json';

type DocumentData = admin.firestore.DocumentData;
type DocumentSnapshot = admin.firestore.DocumentSnapshot;
type DocumentReference = admin.firestore.DocumentReference;

export type Role = 'parent' | 'tutor' | 'tutee' | 'mentor' | 'mentee';

export function isRole(param: unknown): param is Role {
  if (typeof param !== 'string') return false;
  return ['parent', 'tutor', 'tutee', 'mentor', 'mentee'].includes(param);
}

export type UserWithRoles = User & { roles: Role[] };

/**
 * Represents a person that is involved in a request or match. Here, roles are
 * explicitly listed (unlike the `User` object where roles are implied by
 * role-specific properties).
 * @property id - The user's unique Firebase-assigned user ID (note that this
 * contains both lowercase and capital letters which is why it can't be used as
 * a unique anonymous email address handle).
 * @property [name] - The user's name (so we don't have to query an API just to
 * show an intelligible representation of this person).
 * @property [photo] - The user's photo URL (if any). This is included for the
 * same reason as above; speed on the front-end rendering. If not added by the
 * front-end, this is always updated by our back-end GCP function (triggered
 * when user documents are updated so as to keep profile info in sync).
 * @property handle - The user's all-lowercase anonymous email handle.
 * @property roles - The user's roles in this request or match (e.g. `tutor`).
 */
export interface Person {
  id: string;
  name?: string;
  photo?: string;
  handle: string;
  roles: Role[];
}

export function isPerson(json: unknown): json is Person {
  if (!isJSON(json)) return false;
  if (typeof json.id !== 'string') return false;
  if (json.name && typeof json.name !== 'string') return false;
  if (json.photo && typeof json.photo !== 'string') return false;
  if (typeof json.handle !== 'string') return false;
  if (!(json.roles instanceof Array)) return false;
  if (json.roles.some((r) => !isRole(r))) return false;
  return true;
}

/**
 * A venue for a tutoring or mentoring match to occur (e.g. Zoom or Jitsi).
 * @typedef {Object} Venue
 * @extends Resource
 * @property type - The type of venue (currently only Zoom or Jitsi).
 * @property url - The URL of the venue (right now, all venues are online and
 * thus have a definitive URL).
 */
export interface BaseVenue extends Resource {
  type: 'zoom' | 'jitsi';
  url: string;
}

/**
 * An anonymous Jitsi video conferencing room. Jitsi is an open-source software
 * that has a room for every single Zoom meeting venue.
 * @typedef {Object} JitsiVenue
 * @extends BaseVenue
 */
export interface JitsiVenue extends BaseVenue {
  type: 'jitsi';
}

/**
 * A recurring, non-scheduled Zoom meeting venue.
 * @typedef {Object} ZoomVenue
 * @extends BaseVenue
 * @property id - The Zoom meeting ID.
 * @property invite - The Zoom meeting invitation (that includes the meeting
 * URL, telephony audio phone numbers, the meeting topic, etc).
 */
export interface ZoomVenue extends BaseVenue {
  type: 'zoom';
  id: string;
  invite: string;
}

export type Venue = ZoomVenue | JitsiVenue;

export function isVenue(json: unknown): json is Venue {
  if (!isJSON(json)) return false;
  if (typeof json.url !== 'string') return false;
  if (json.type === 'zoom') {
    if (typeof json.id !== 'string') return false;
    if (typeof json.invite !== 'string') return false;
  } else if (json.type !== 'jitsi') {
    return false;
  }
  return true;
}

/**
 * Represents a tutoring lesson or mentoring appointment.
 * @typedef {Object} MatchInterface
 * @property org - The ID of the organization that owns this request or match.
 * @property subjects - The subjects that this match is about (e.g. AP CS).
 * @property people - The people involved in this match (i.e. pupil and tutor).
 * @property creator - The person who created this match (e.g. pupil or admin).
 * @property message - A more detailed description of this match or request.
 * @property venue - The meeting venue (e.g. Zoom or Jitsi) for this match.
 * @property [times] - When the people in this match will meet.
 * @property [request] - The request that was fulfilled by this match (if any).
 */
export interface MatchInterface {
  org: string;
  subjects: string[];
  people: Person[];
  creator: Person;
  message: string;
  venue: Venue;
  times?: Availability;
  request?: Match;
  ref?: DocumentReference;
  id: string;
}

export type MatchJSON = Omit<MatchInterface, 'times' | 'request'> & {
  times?: AvailabilityJSON;
  request?: MatchJSON;
};

export type MatchSearchHit = ObjectWithObjectID &
  Omit<MatchInterface, 'times' | 'request'> & {
    times?: AvailabilitySearchHit;
    request?: MatchSearchHit;
  };

// TODO: Implement this to actually verify that the given JSON is valid.
export function isMatchJSON(json: unknown): json is MatchJSON {
  if (!isJSON(json)) return false;
  if (typeof json.org !== 'string') return false;
  if (!(json.subjects instanceof Array)) return false;
  if (json.subjects.some((s) => typeof s !== 'string')) return false;
  if (!(json.people instanceof Array)) return false;
  if (json.people.some((p) => !isPerson(p))) return false;
  if (!isPerson(json.creator)) return false;
  if (typeof json.message !== 'string') return false;
  if (!isVenue(json.venue)) return false;
  if (json.times && !isAvailabilityJSON(json.times)) return false;
  if (json.request && !isMatchJSON(json.request)) return false;
  if (typeof json.id !== 'string') return false;
  return true;
}

export class Match implements MatchInterface {
  public org = 'default';

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

  public venue: Venue = {
    type: 'jitsi',
    url: `https://meet.jit.si/TB-${nanoid(10)}`,
    created: new Date(),
    updated: new Date(),
  };

  public times?: Availability;

  public request?: Match;

  public ref?: DocumentReference;

  public id = '';

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
    const { times, request, ...rest } = this;
    return {
      ...rest,
      times: times ? times.toJSON() : undefined,
      request: request ? request.toJSON() : undefined,
    };
  }

  public static fromJSON(json: MatchJSON): Match {
    const { times, request, ...rest } = json;
    return new Match({
      ...rest,
      times: times ? Availability.fromJSON(times) : undefined,
      request: request ? Match.fromJSON(request) : undefined,
    });
  }

  public toFirestore(): DocumentData {
    const { times, request, ref, id, ...rest } = this;
    return firestoreVals({
      ...rest,
      times: times ? times.toFirestore() : undefined,
      request: request ? request.toFirestore() : undefined,
    });
  }

  public static fromFirestore(snapshot: DocumentSnapshot): Match {
    const matchData: DocumentData | undefined = snapshot.data();
    if (matchData) {
      const { times, request, ...rest } = matchData;
      return new Match({
        ...rest,
        times: times ? Availability.fromFirestore(times) : undefined,
        request: request ? Match.fromJSON(request) : undefined,
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
    const { times, request, objectID, ...rest } = hit;
    return new Match({
      ...rest,
      times: times ? Availability.fromSearchHit(times) : undefined,
      request: request ? Match.fromSearchHit(request) : undefined,
      id: objectID,
    });
  }
}

// Matches and requests share exactly the same data model, but are just stored
// in different places within our database (and have different names when used
// throughout the code base, as aliased here).
export { Match as Request };
export { isMatchJSON as isRequestJSON };
export type RequestInterface = MatchInterface;
export type RequestSearchHit = MatchSearchHit;
export type RequestJSON = MatchJSON;
