import to from 'await-to-js';

import { APIError } from 'lib/api/error';
import { Request } from 'lib/model';
import { db } from 'lib/api/firebase';
import clone from 'lib/utils/clone';

/**
 * Creates the Firestore database document for the given request.
 * @param request - The request to create a document for.
 * @return Promise that resolves to the created request; throws an `APIError` if
 * we were unable to create the Firestore document.
 * @todo Reduce the code duplication between this and the `createMatchDoc` fx
 * (e.g. by creating a general database document creation component fx).
 */
export default async function createRequestDoc(
  request: Request
): Promise<Request> {
  const ref = db.collection('requests').doc();
  const copy = new Request(clone({ ...request, id: ref.id }));
  const [err] = await to(ref.set(copy.toFirestore()));
  if (err) {
    const msg = `${
      err.name
    } saving request (${request.toString()}) to database`;
    throw new APIError(`${msg}: ${err.message}`, 500);
  }
  return copy;
}
