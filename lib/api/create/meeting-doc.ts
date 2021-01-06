import to from 'await-to-js';

import { APIError } from 'lib/api/error';
import { Meeting } from 'lib/model';
import clone from 'lib/utils/clone';
import { db } from 'lib/api/firebase';

export default async function createMeetingDoc(
  meeting: Meeting
): Promise<Meeting> {
  const matchId = meeting.match.id;
  const col = db.collection('matches').doc(matchId).collection('meetings');
  const ref = meeting.id ? col.doc(meeting.id) : col.doc();
  const copy = new Meeting(clone({ ...meeting, id: ref.id }));
  const [err] = await to(ref.set(copy.toFirestore()));
  if (err) {
    const msg = `${
      err.name
    } saving meeting (${meeting.toString()}) to database`;
    throw new APIError(`${msg}: ${err.message}`, 500);
  }
  return copy;
}
