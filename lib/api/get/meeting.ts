import { APIError } from 'lib/api/error';
import { Meeting } from 'lib/model';
import { db } from 'lib/api/firebase';

export default async function getMeeting(id: string): Promise<Meeting> {
  const doc = await db.collection('meetings').doc(id).get();
  if (!doc.exists)
    throw new APIError(`Meeting (${id}) does not exist in database`);
  return Meeting.fromFirestoreDoc(doc);
}
