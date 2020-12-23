import { Match } from 'lib/model';
import { db } from 'lib/api/firebase';

// TODO: Refactor and clean up the uneccessary complexities in the `Query` class
// definitions and use that instead of directly querying the database here.
export default async function getUserMatches(uid: string): Promise<Match[]> {
  return (
    await db
      .collection('matches')
      .where('peopleIds', 'array-contains', uid)
      .get()
  ).docs.map((match) => Match.fromFirestoreDoc(match));
}
