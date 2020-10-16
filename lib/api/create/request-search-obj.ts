import to from 'await-to-js';

import { APIError } from 'lib/api/error';
import { Request } from 'lib/model';
import index from 'lib/api/algolia';

export default async function createRequestSearchObj(
  request: Request
): Promise<void> {
  const [err] = await to(index('requests', request));
  if (err) {
    const msg = `${err.name} saving request (${request.toString()}) to Algolia`;
    throw new APIError(`${msg}: ${err.message}`, 500);
  }
}
