import { Person, User } from 'lib/model';
import { addRoles, join } from 'lib/utils';
import { APIError } from 'lib/api/error';
import getUser from 'lib/api/get/user';

/**
 * Fetches the person's complete user data. First, tries to fetch the data from
 * the given existing `people` data. If that fails, it will then fetch the data
 * directly from our database.
 * @param person - The person whose data we want to fetch.
 * @param [people] - Pre-fetched user data (to check first *before* making
 * database requests).
 * @return Promise that resolve to the person's complete user data.
 */
export default async function getPerson(
  { id, roles, name }: Person,
  people: User[] = []
): Promise<User> {
  if (!id) {
    const pst = roles.length ? `Person (${join(roles)})` : 'Person';
    const msg = `${name || pst} does not have an ID`;
    throw new APIError(msg, 400);
  }

  const prefetched = people[people.findIndex((p) => p.id === id)];
  if (prefetched) return addRoles(prefetched, prefetched.roles);

  const user = await getUser(id);
  return addRoles(user, roles);
}
