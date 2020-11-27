import { Person, User } from 'lib/model';
import { APIError } from 'lib/api/error';
import { addRoles } from 'lib/utils';
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
  person: Person,
  people: User[] = []
): Promise<User> {
  if (!person.id) {
    const msg = `${person.name || 'Person'} does not have uID`;
    throw new APIError(msg, 400);
  }

  const prefetched = people[people.findIndex((p) => p.id === person.id)];
  if (prefetched) return addRoles(prefetched, prefetched.roles);

  const user = await getUser(person.id);
  return addRoles(user, person.roles);
}
