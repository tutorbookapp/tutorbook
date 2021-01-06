import to from 'await-to-js';

import { APIError } from 'lib/api/error';
import { db } from 'lib/api/firebase';

export default async function deleteMeetingDoc(
  meetingId: string
): Promise<void> {
  const [err] = await to(db.collection('meetings').doc(meetingId).delete());
  if (err) {
    const msg = `${err.name} deleting meeting (${meetingId}) from database`;
    throw new APIError(`${msg}: ${err.message}`, 500);
  }
}
