import * as admin from 'firebase-admin';
import { ObjectWithObjectID } from '@algolia/client-search';

import {
  Match,
  MatchFirestore,
  MatchJSON,
  MatchSearchHit,
  isMatchJSON,
} from 'lib/model/match';
import {
  Resource,
  ResourceFirestore,
  ResourceInterface,
  ResourceJSON,
  ResourceSearchHit,
  isResourceJSON,
} from 'lib/model/resource';
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
import construct from 'lib/model/construct';
import definedVals from 'lib/model/defined-vals';
import { isJSON } from 'lib/model/json';

type DocumentData = admin.firestore.DocumentData;
type DocumentSnapshot = admin.firestore.DocumentSnapshot;
type DocumentReference = admin.firestore.DocumentReference;

/**
 * A meeting is a past appointment logged for a match (e.g. John and Jane met
 * last week for 30 mins on Tuesday 3:00 - 3:30 PM).
 * @typedef {Object} Meeting
 * @extends Resource
 * @property match - This meeting's match.
 * @property venue - Link to the meeting venue (e.g. Zoom or Jitsi).
 * @property time - Time of the meeting (e.g. Tuesday 3:00 - 3:30 PM).
 * @property creator - The person who logged the meeting (typically the tutor).
 * @property notes - Notes about the meeting (e.g. what they worked on).
 */
export interface MeetingInterface extends ResourceInterface {
  match: Match;
  venue: Venue;
  time: Timeslot;
  notes: string;
  ref?: DocumentReference;
  id: string;
}

export type MeetingJSON = Omit<
  MeetingInterface,
  keyof Resource | 'time' | 'venue' | 'match'
> &
  ResourceJSON & { time: TimeslotJSON; venue: VenueJSON; match: MatchJSON };
export type MeetingFirestore = Omit<
  MeetingInterface,
  keyof Resource | 'time' | 'venue' | 'match'
> &
  ResourceFirestore & {
    time: TimeslotFirestore;
    venue: VenueFirestore;
    match: MatchFirestore;
  };
export type MeetingSearchHit = ObjectWithObjectID &
  Omit<MeetingInterface, keyof Resource | 'time' | 'venue' | 'match' | 'id'> &
  ResourceSearchHit & {
    time: TimeslotSearchHit;
    venue: VenueSearchHit;
    match: MatchSearchHit;
  };

export function isMeetingJSON(json: unknown): json is MeetingJSON {
  if (!isResourceJSON(json)) return false;
  if (!isJSON(json)) return false;
  if (!isMatchJSON(json.match)) return false;
  if (!isVenueJSON(json.venue)) return false;
  if (!isTimeslotJSON(json.time)) return false;
  if (typeof json.notes !== 'string') return false;
  if (typeof json.id !== 'string') return false;
  return true;
}

export class Meeting extends Resource implements MeetingInterface {
  public match = new Match();

  public venue = new Venue();

  public time = new Timeslot();

  public notes = '';

  public id = '';

  public ref?: DocumentReference;

  public constructor(meeting: Partial<MeetingInterface> = {}) {
    super(meeting);
    construct<MeetingInterface, ResourceInterface>(
      this,
      meeting,
      new Resource()
    );
  }

  public toString(): string {
    return `Meeting on ${this.time.toString()}`;
  }

  public toJSON(): MeetingJSON {
    const { time, venue, match, ...rest } = this;
    return definedVals({
      ...rest,
      ...super.toJSON(),
      time: time.toJSON(),
      venue: venue.toJSON(),
      match: match.toJSON(),
      ref: undefined,
    });
  }

  public static fromJSON({
    time,
    venue,
    match,
    ...rest
  }: MeetingJSON): Meeting {
    return new Meeting({
      ...rest,
      ...Resource.fromJSON(rest),
      time: Timeslot.fromJSON(time),
      venue: Venue.fromJSON(venue),
      match: Match.fromJSON(match),
    });
  }

  public toFirestore(): MeetingFirestore {
    const { time, venue, match, ...rest } = this;
    return definedVals({
      ...rest,
      ...super.toFirestore(),
      time: time.toFirestore(),
      venue: venue.toFirestore(),
      match: match.toFirestore(),
      ref: undefined,
    });
  }

  public static fromFirestore({
    time,
    venue,
    match,
    ...rest
  }: MeetingFirestore): Meeting {
    return new Meeting({
      ...rest,
      ...Resource.fromFirestore(rest),
      time: Timeslot.fromFirestore(time),
      venue: Venue.fromFirestore(venue),
      match: Match.fromFirestore(match),
    });
  }

  public static fromFirestoreDoc(snapshot: DocumentSnapshot): Meeting {
    if (snapshot.data())
      return new Meeting({
        ...Meeting.fromFirestore(snapshot.data() as MeetingFirestore),
        ref: snapshot.ref,
        id: snapshot.id,
      });
    return new Meeting();
  }

  public toSearchHit(): MeetingSearchHit {
    const { time, venue, match, id, ...rest } = this;
    return definedVals({
      ...rest,
      ...super.toSearchHit(),
      time: time.toSearchHit(),
      venue: venue.toSearchHit(),
      match: match.toSearchHit(),
      ref: undefined,
      id: undefined,
      objectID: id,
    });
  }

  public static fromSearchHit({
    time,
    venue,
    match,
    objectID,
    ...rest
  }: MeetingSearchHit): Meeting {
    return new Meeting({
      ...rest,
      ...Resource.fromSearchHit(rest),
      time: Timeslot.fromSearchHit(time),
      venue: Venue.fromSearchHit(venue),
      match: Match.fromSearchHit(match),
      id: objectID,
    });
  }
}
