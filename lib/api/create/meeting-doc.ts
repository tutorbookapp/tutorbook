import to from 'await-to-js';

import { APIError } from 'lib/api/error';
import { Meeting } from 'lib/model/meeting';
import clone from 'lib/utils/clone';
import { db } from 'lib/api/firebase';

/**
 * Creates the Firestore database document for the given meeting.
 * @param meeting - The meeting to create a document for (we ignore its `id`).
 * @return Promise that resolves to the created meeting; throws an `APIError` if
 * we were unable to create the Firestore document.
 */
export default async function createMeetingDoc(
  meeting: Meeting
): Promise<Meeting> {
  const ref = db.collection('meetings').doc();
  const copy = new Meeting(clone({ ...meeting, id: ref.id }));
  const [e] = await to(ref.set(copy.toFirestore()));
  if (e) {
    const msg = `${e.name} saving meeting (${meeting.toString()}) to database`;
    throw new APIError(`${msg}: ${e.message}`, 500);
  }
  return copy;
}
