import { Meeting } from 'lib/model';
import { db } from 'lib/api/firebase';

export default async function getMeetings(id: string): Promise<Meeting[]> {
  const ref = db.collection('matches').doc(id).collection('meetings');
  const query = ref.orderBy('created');
  return (await query.get()).docs.map(Meeting.fromFirestoreDoc);
}
