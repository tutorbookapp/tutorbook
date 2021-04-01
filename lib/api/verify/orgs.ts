import { APIError } from 'lib/api/error';
import { User } from 'lib/model/org';

/**
 * Verifies that a user belongs to (at least one of) the specified org(s).
 * @param user - The user to check.
 * @param orgIds - The orgs to which the user must belong to.
 * @return Nothing; throws an `APIError` if the user does NOT belong to (at
 * least one of) the specified org(s).
 */
export default function verifyOrgs(user: User, orgIds: string[]): void {
  if (orgIds.some((orgId) => user.orgs.includes(orgId))) return;
  throw new APIError(`${user.toString()} does not belong to your orgs`, 401);
}
