import to from 'await-to-js';

import { APIError } from 'lib/api/error';
import { db } from 'lib/api/firebase';

export default async function deleteMatchDoc(matchId: string): Promise<void> {
  const [err] = await to(db.collection('matches').doc(matchId).delete());
  if (err) {
    const msg = `${err.name} deleting match (${matchId}) from database`;
    throw new APIError(`${msg}: ${err.message}`, 500);
  }
}
