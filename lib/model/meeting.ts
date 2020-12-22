import * as admin from 'firebase-admin';

import {
  Match,
  MatchFirestore,
  MatchInterface,
  MatchJSON,
  MatchSearchHit,
  isMatchJSON,
} from 'lib/model/match';
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
import { isJSON } from 'lib/model/json';

type DocumentData = admin.firestore.DocumentData;
type DocumentSnapshot = admin.firestore.DocumentSnapshot;
type DocumentReference = admin.firestore.DocumentReference;

/**
 * A meeting is a past appointment logged for a match (e.g. John and Jane met
 * last week for 30 mins on Tuesday 3:00 - 3:30 PM).
 * @typedef {Object} Meeting
 * @extends Match
 * @property venue - Link to the meeting venue (e.g. Zoom or Jitsi).
 * @property time - Time of the meeting (e.g. Tuesday 3:00 - 3:30 PM).
 * @property creator - The person who logged the meeting (typically the tutor).
 * @property notes - Notes about the meeting (e.g. what they worked on).
 */
export interface MeetingInterface extends MatchInterface {
  venue: Venue;
  time: Timeslot;
  notes: string;
  ref?: DocumentReference;
  id: string;
}

export type MeetingJSON = Omit<
  MeetingInterface,
  keyof MatchInterface | 'time' | 'venue'
> &
  MatchJSON & { time: TimeslotJSON; venue: VenueJSON };
export type MeetingFirestore = Omit<
  MeetingInterface,
  keyof MatchInterface | 'time' | 'venue'
> &
  MatchFirestore & { time: TimeslotFirestore; venue: VenueFirestore };
export type MeetingSearchHit = Omit<
  MeetingInterface,
  keyof Match | 'time' | 'venue'
> &
  MatchSearchHit & { time: TimeslotSearchHit; venue: VenueSearchHit };

export function isMeetingJSON(json: unknown): json is MeetingJSON {
  if (!isMatchJSON(json)) return false;
  if (!isJSON(json)) return false;
  if (!isVenueJSON(json.venue)) return false;
  if (!isTimeslotJSON(json.time)) return false;
  if (typeof json.notes !== 'string') return false;
  if (typeof json.id !== 'string') return false;
  return true;
}

export class Meeting extends Match implements MeetingInterface {
  public venue = new Venue();

  public time = new Timeslot();

  public notes = '';

  public ref?: DocumentReference;

  public id = '';

  public constructor(meeting: Partial<MeetingInterface> = {}) {
    super(meeting);
    construct<MeetingInterface, MatchInterface>(this, meeting, new Match());
  }

  public toString(): string {
    return `Meeting on ${this.time.toString()}`;
  }

  public toJSON(): MeetingJSON {
    const { time, venue, ref, ...rest } = this;
    return {
      ...rest,
      ...super.toJSON(),
      time: time.toJSON(),
      venue: venue.toJSON(),
    };
  }

  public static fromJSON({ time, venue, ...rest }: MeetingJSON): Meeting {
    return new Meeting({
      ...rest,
      ...Match.fromJSON(rest),
      time: Timeslot.fromJSON(time),
      venue: Venue.fromJSON(venue),
    });
  }

  public toFirestore(): MeetingFirestore {
    const { time, venue, ref, ...rest } = this;
    return {
      ...rest,
      ...super.toFirestore(),
      time: time.toFirestore(),
      venue: venue.toFirestore(),
    };
  }

  public static fromFirestore(snapshot: DocumentSnapshot): Meeting {
    const data: DocumentData | undefined = snapshot.data();
    if (data) {
      const { time, venue, ...rest } = data as MeetingFirestore;
      return new Meeting({
        ...rest,
        ...Match.fromFirestore(snapshot),
        time: Timeslot.fromFirestore(time),
        venue: Venue.fromFirestore(venue),
        ref: snapshot.ref,
        id: snapshot.id,
      });
    }
    console.warn(
      `[WARNING] Tried to create meeting (${snapshot.ref.id}) from ` +
        'non-existent Firestore document.'
    );
    return new Meeting();
  }

  public static fromSearchHit({
    time,
    venue,
    ...rest
  }: MeetingSearchHit): Meeting {
    return new Meeting({
      ...rest,
      ...Match.fromSearchHit(rest),
      time: Timeslot.fromSearchHit(time),
      venue: Venue.fromSearchHit(venue),
    });
  }
}
