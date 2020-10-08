import { IncomingHttpHeaders } from 'http';

import to from 'await-to-js';

import { DecodedIdToken, auth } from 'lib/api/helpers/firebase';
import APIError from 'lib/api/helpers/error';
import fetchOrgsByAdminId from 'lib/api/fetch/orgs-by-admin-id';

/**
 * Verifies the authorization header by:
 * 1. Checking that it contains a valid Firebase Authorization JWT.
 * 2. (Optional) Verifying that the JWT belongs to a certain user OR to an admin
 * of any one of the specified orgs.
 * @param headers - The request headers to verify.
 * @param [options] - Specify if the JWT must belong to a certain user OR to an
 * admin access of any one of the specified orgs.
 * @return Promise that resolves to nothing; throws an `APIError` if the user is
 * unauthenticated.
 * @example
 * // Verify request is from a logged-in user.
 * await verifyAuth(req.headers);
 * // Verify request is from user with uID `student`.
 * await verifyAuth(req.headers, { userId: 'student' });
 * // Verify request is from an admin for either `gunn` or `paly`.
 * await verifyAuth(req.headers, { orgIds: ['gunn', 'paly'] });
 */
export default async function verifyAuth(
  headers: IncomingHttpHeaders,
  options?: { userId?: string; orgIds?: string[] }
): Promise<void> {
  if (typeof headers.authorization !== 'string')
    throw new APIError('You must provide a valid authorization header', 401);
  if (!headers.authorization.startsWith('Bearer '))
    throw new APIError('Your authorization header must use a JWT', 401);

  const jwt = headers.authorization.replace('Bearer ', '');
  const [err, token] = await to<DecodedIdToken>(auth.verifyIdToken(jwt, true));

  if (err) throw new APIError(`Your JWT is invalid: ${err.message}`, 401);

  // Check if JWT belongs to `userId` OR an admin to any one of the `orgIds`
  const { uid } = token as DecodedIdToken;
  if (!options) return;
  if (options && options.userId && uid === options.userId) return;
  if (options && options.orgIds && options.orgIds.length) {
    const orgIds = (await fetchOrgsByAdminId(uid)).map((o) => o.id);
    if (options.orgIds.some((orgId) => orgIds.includes(orgId))) return;
  }
  throw new APIError('You are not authorized to perform this action', 401);
}
