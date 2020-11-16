import * as admin from 'firebase-admin';
import { ObjectWithObjectID } from '@algolia/client-search';
import { v4 as uuid } from 'uuid';

import {
  Timeslot,
  TimeslotFirestore,
  TimeslotJSON,
  TimeslotSearchHit,
  isTimeslotJSON,
} from 'lib/model/timeslot';
import {
  Venue,
  VenueFirestore,
  VenueJSON,
  VenueSearchHit,
  isVenueJSON,
} from 'lib/model/venue';
import { Aspect } from 'lib/model/aspect';
import { User } from 'lib/model/user';
import construct from 'lib/model/construct';
import firestoreVals from 'lib/model/firestore-vals';
import { isJSON } from 'lib/model/json';

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
 * The different states of a match or request.
 * @enum {string} MatchStatus
 * @property new - When the match is first created; a match stays in the `new`
 * state for at least a week after it's been created until it is either moved to
 * `active` or `stale`.
 * @property active - When the people in the match are actively meeting on a
 * regular, recurring basis (e.g once a week, they have tutoring lessons after
 * school for ~60mins). This is the ideal state of the match.
 * @property stale - When the people in the match have not met or have ceased
 * communications for over a week. A stale match needs re-engagement or should
 * be deleted.
 */
export type MatchStatus = 'new' | 'active' | 'stale';

/**
 * Represents a tutoring lesson or mentoring appointment.
 * @typedef {Object} MatchInterface
 * @property status - The status of the match (`new`, `active`, or `stale`).
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
  status: MatchStatus;
  org: string;
  subjects: string[];
  people: Person[];
  creator: Person;
  message: string;
  venue: Venue;
  time?: Timeslot;
  request?: Match;
  ref?: DocumentReference;
  id: string;
}

export type MatchJSON = Omit<MatchInterface, 'time' | 'request' | 'venue'> & {
  time?: TimeslotJSON;
  request?: MatchJSON;
  venue: VenueJSON;
};

export type MatchSearchHit = ObjectWithObjectID &
  Omit<MatchInterface, 'time' | 'request' | 'venue'> & {
    time?: TimeslotSearchHit;
    request?: MatchSearchHit;
    venue: VenueSearchHit;
  };

export type MatchFirestore = Omit<
  MatchInterface,
  'time' | 'request' | 'venue'
> & {
  time?: TimeslotFirestore;
  request?: MatchFirestore;
  venue: VenueFirestore;
};

export function isMatchJSON(json: unknown): json is MatchJSON {
  if (!isJSON(json)) return false;
  if (typeof json.status !== 'string') return false;
  if (!['new', 'active', 'stale'].includes(json.status)) return false;
  if (typeof json.org !== 'string') return false;
  if (!(json.subjects instanceof Array)) return false;
  if (json.subjects.some((s) => typeof s !== 'string')) return false;
  if (!(json.people instanceof Array)) return false;
  if (json.people.some((p) => !isPerson(p))) return false;
  if (!isPerson(json.creator)) return false;
  if (typeof json.message !== 'string') return false;
  if (!isVenueJSON(json.venue)) return false;
  if (json.time && !isTimeslotJSON(json.time)) return false;
  if (json.request && !isMatchJSON(json.request)) return false;
  if (typeof json.id !== 'string') return false;
  return true;
}

export class Match implements MatchInterface {
  public status: MatchStatus = 'new';

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

  public venue: Venue = new Venue();

  public time?: Timeslot;

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
    const { time, request, venue, ref, ...rest } = this;
    return {
      ...rest,
      time: time ? time.toJSON() : undefined,
      request: request ? request.toJSON() : undefined,
      venue: venue.toJSON(),
    };
  }

  public static fromJSON(json: MatchJSON): Match {
    const { time, request, venue, ...rest } = json;
    return new Match({
      ...rest,
      time: time ? Timeslot.fromJSON(time) : undefined,
      request: request ? Match.fromJSON(request) : undefined,
      venue: Venue.fromJSON(venue),
    });
  }

  public toFirestore(): DocumentData {
    const { time, request, venue, ref, ...rest } = this;
    return firestoreVals({
      ...rest,
      time: time ? time.toFirestore() : undefined,
      request: request ? request.toFirestore() : undefined,
      venue: venue.toFirestore(),
    });
  }

  public static fromFirestore(snapshot: DocumentSnapshot): Match {
    const matchData: DocumentData | undefined = snapshot.data();
    if (matchData) {
      const { time, request, venue, ...rest } = matchData;
      return new Match({
        ...rest,
        time: time ? Timeslot.fromFirestore(time) : undefined,
        request: request ? Match.fromJSON(request) : undefined,
        venue: Venue.fromFirestore(venue),
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
    const { time, request, venue, objectID, ...rest } = hit;
    return new Match({
      ...rest,
      time: time ? Timeslot.fromSearchHit(time) : undefined,
      request: request ? Match.fromSearchHit(request) : undefined,
      venue: Venue.fromSearchHit(venue),
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
