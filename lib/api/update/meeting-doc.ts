import to from 'await-to-js';

import { APIError } from 'lib/api/error';
import { Meeting } from 'lib/model/meeting';
import { db } from 'lib/api/firebase';

export default async function updateMeetingDoc(
  meeting: Meeting
): Promise<void> {
  const ref = db.collection('meetings').doc(meeting.id);
  const [e] = await to(ref.set(meeting.toFirestore()));
  if (e) {
    const m = `${e.name} updating meeting (${meeting.toString()}) in database`;
    throw new APIError(`${m}: ${e.message}`, 500);
  }
}
