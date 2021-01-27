import { APIError } from 'lib/api/error';
import { db } from 'lib/api/firebase';

export default async function verifyDocExists(
  ...path: string[]
): Promise<void> {
  const doc = await db.doc(path.join('/')).get();
  if (!doc.exists) {
    const msg = `Document (${path.join('/')}) does not exist in database`;
    throw new APIError(msg, 400);
  }
}
