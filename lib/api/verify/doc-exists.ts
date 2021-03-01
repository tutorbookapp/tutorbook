import { DocumentSnapshot, db } from 'lib/api/firebase';
import { APIError } from 'lib/api/error';

export default async function verifyDocExists(
  ...path: string[]
): Promise<DocumentSnapshot> {
  const doc = await db.doc(path.join('/')).get();
  if (!doc.exists) {
    const msg = `Document (${path.join('/')}) does not exist in database`;
    throw new APIError(msg, 400);
  }
  return doc;
}
