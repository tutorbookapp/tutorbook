import * as admin from 'firebase-admin';
import { v4 as uuid } from 'uuid';

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
import { Person, isPerson } from 'lib/model/person';
import construct from 'lib/model/construct';
import { isJSON } from 'lib/model/json';

type DocumentData = admin.firestore.DocumentData;
type DocumentSnapshot = admin.firestore.DocumentSnapshot;
type DocumentReference = admin.firestore.DocumentReference;

/**
 * A meeting is a past appointment logged for a match (e.g. John and Jane met
 * last week for 30 mins on Tuesday 3:00 - 3:30 PM).
 * @typedef {Object} Meeting
 * @extends Resource
 * @property time - Time of the meeting (e.g. Tuesday 3:00 - 3:30 PM).
 * @property creator - The person who logged the meeting (typically the tutor).
 * @property notes - Notes about the meeting (e.g. what they worked on).
 */
export interface MeetingInterface extends ResourceInterface {
  time: Timeslot;
  creator: Person;
  notes: string;
  ref?: DocumentReference;
  id: string;
}

export type MeetingJSON = Omit<
  MeetingInterface,
  keyof ResourceInterface | 'time'
> &
  ResourceJSON & { time: TimeslotJSON };
export type MeetingFirestore = Omit<
  MeetingInterface,
  keyof ResourceInterface | 'time'
> &
  ResourceFirestore & { time: TimeslotFirestore };
export type MeetingSearchHit = Omit<MeetingInterface, keyof Resource | 'time'> &
  ResourceSearchHit & { time: TimeslotSearchHit };

export function isMeetingJSON(json: unknown): json is MeetingJSON {
  if (!isResourceJSON(json)) return false;
  if (!isJSON(json)) return false;
  if (!isTimeslotJSON(json.time)) return false;
  if (!isPerson(json.creator)) return false;
  if (typeof json.notes !== 'string') return false;
  if (typeof json.id !== 'string') return false;
  return true;
}

export class Meeting extends Resource implements MeetingInterface {
  public time = new Timeslot();

  public creator: Person = {
    id: '',
    name: '',
    photo: '',
    handle: uuid(),
    roles: [],
  };

  public notes = '';

  public ref?: DocumentReference;

  public id = '';

  public constructor(meeting: Partial<MeetingInterface> = {}) {
    super(meeting);
    construct<MeetingInterface, ResourceInterface>(
      this,
      meeting,
      new Resource()
    );
  }

  public toJSON(): MeetingJSON {
    const { time, ref, ...rest } = this;
    return { ...rest, ...super.toJSON(), time: time.toJSON() };
  }

  public static fromJSON({ time, ...rest }: MeetingJSON): Meeting {
    return new Meeting({
      ...rest,
      ...Resource.fromJSON(rest),
      time: Timeslot.fromJSON(time),
    });
  }

  public toFirestore(): MeetingFirestore {
    const { time, ref, ...rest } = this;
    return { ...rest, ...super.toFirestore(), time: time.toFirestore() };
  }

  public static fromFirestoreDoc(snapshot: DocumentSnapshot): Meeting {
    const data: DocumentData | undefined = snapshot.data();
    if (data) {
      const { time, ...rest } = data as MeetingFirestore;
      return new Meeting({
        ...rest,
        ...Resource.fromFirestore(rest),
        time: Timeslot.fromFirestore(time),
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

  public static fromFirestore({ time, ...rest }: MeetingFirestore): Meeting {
    return new Meeting({
      ...rest,
      ...Resource.fromFirestore(rest),
      time: Timeslot.fromFirestore(time),
    });
  }

  public static fromSearchHit({ time, ...rest }: MeetingSearchHit): Meeting {
    return new Meeting({
      ...rest,
      ...Resource.fromSearchHit(rest),
      time: Timeslot.fromSearchHit(time),
    });
  }
}
