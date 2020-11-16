import { Event, eventFromDoc } from 'lib/model';
import { APIError } from 'lib/api/error';
import { db } from 'lib/api/firebase';

export default async function getEvents(id: string): Promise<Event[]> {
  const ref = db.collection('matches').doc(id).collection('events');
  return (await ref.get()).docs.map(eventFromDoc);
}
