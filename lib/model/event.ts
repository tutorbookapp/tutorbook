import * as admin from 'firebase-admin';

import { Timeslot, TimeslotFirestore, TimeslotJSON } from 'lib/model/timeslot';
import { Person } from 'lib/model/match';

type DocumentSnapshot = admin.firestore.DocumentSnapshot;
type Timestamp = admin.firestore.Timestamp;

interface BaseEvent {
  timestamp: Date;
  person: Person;
  id: string;
}
type BaseEventJSON = Omit<BaseEvent, 'timestamp'> & { timestamp: 'string' };
type BaseEventFirestore = Omit<BaseEvent, 'timestamp'> & {
  timestamp: Timestamp;
};

export interface MessageEvent extends BaseEvent {
  type: 'message';
  message: string;
}
export type MessageEventJSON = Omit<MessageEvent, keyof BaseEvent> &
  BaseEventJSON;
export type MessageEventFirestore = Omit<MessageEvent, keyof BaseEvent> &
  BaseEventFirestore;

export interface ApptEvent extends BaseEvent {
  type: 'appt';
  time: Timeslot;
}
export type ApptEventJSON = Omit<ApptEvent, keyof BaseEvent | 'time'> &
  BaseEventJSON & { time: TimeslotJSON };
export type ApptEventFirestore = Omit<ApptEvent, keyof BaseEvent | 'time'> &
  BaseEventFirestore & { time: TimeslotFirestore };

export interface EditEvent extends BaseEvent {
  type: 'edit';
  removed: string[];
  added: string[];
}
export type EditEventJSON = Omit<EditEvent, keyof BaseEvent> & BaseEventJSON;
export type EditEventFirestore = Omit<EditEvent, keyof BaseEvent> &
  BaseEventFirestore;

export type Event = MessageEvent | ApptEvent | EditEvent;
export type EventJSON = MessageEventJSON | ApptEventJSON | EditEventJSON;
export type EventFirestore =
  | MessageEventFirestore
  | ApptEventFirestore
  | EditEventFirestore;

export function eventFromFirestore(data: EventFirestore): Event {
  const event: any = { ...data, timestamp: data.timestamp.toDate() };
  if (data.type === 'appt') event.time = Timeslot.fromFirestore(data.time);
  return event as Event;
}

export function eventFromDoc(snapshot: DocumentSnapshot): Event {
  const data = snapshot.data();
  if (!data) throw new Error('Cannot create event from empty Firestore doc');
  return eventFromFirestore({ ...(data as EventFirestore), id: snapshot.id });
}

export function eventFromJSON(json: EventJSON): Event {
  const event: any = { ...json, timestamp: new Date(json.timestamp) };
  if (json.type === 'appt') event.time = Timeslot.fromJSON(json.time);
  return event as Event;
}

export function eventToJSON(event: Event): EventJSON {
  const json: any = { ...event, timestamp: event.timestamp.toJSON() };
  if (event.type === 'appt') json.time = event.time.toJSON();
  return json as EventJSON;
}
