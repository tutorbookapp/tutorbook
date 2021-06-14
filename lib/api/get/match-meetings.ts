import { Meeting } from 'lib/model/meeting';
import { db } from 'lib/api/firebase';

export default async function getMatchMeetings(
  matchId: string
): Promise<Meeting[]> {
  return (
    await db.collection('meetings').where('match.id', '==', matchId).get()
  ).docs.map((m) => Meeting.fromFirestoreDoc(m));
}
