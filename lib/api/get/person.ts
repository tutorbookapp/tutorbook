import { Person, Role, User, UserWithRoles } from 'lib/model';
import { db } from 'lib/api/helpers/firebase';
import APIError from 'lib/api/helpers/error';
import clone from 'lib/utils/clone';

function addRoles(user: User, roles: Role[]): UserWithRoles {
  const userWithRoles = new User(clone(user));
  (userWithRoles as UserWithRoles).roles = roles;
  return user as UserWithRoles;
}

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
  people: UserWithRoles[] = []
): Promise<UserWithRoles> {
  if (!person.id)
    throw new APIError(`${person.name || 'Person'} does not have uID`);

  const prefetched = people[people.findIndex((p) => p.id === person.id)];
  if (prefetched) return addRoles(prefetched, prefetched.roles);

  const doc = await db.collection('users').doc(person.id).get();
  if (!doc.exists)
    throw new APIError(
      `${person.name || 'Person'} (${person.id}) does not exist`
    );
  return addRoles(User.fromFirestore(doc), person.roles);
}
