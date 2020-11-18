import { Meeting } from 'lib/model';
import { APIError } from 'lib/api/error';
import { db } from 'lib/api/firebase';

export default async function getMeetings(id: string): Promise<Meeting[]> {
  const ref = db.collection('matches').doc(id).collection('meetings');
  return (await ref.get()).docs.map(Meeting.fromFirestore);
}
