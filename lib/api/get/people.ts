import { User } from 'lib/model/user';
import getPerson from 'lib/api/get/person';

/**
 * Fetches the complete user data of a given array of people.
 * @param people - An array of people to fetch.
 * @return An array of the complete user data for each of the specified people.
 */
export default async function getPeople(people: User[]): Promise<User[]> {
  return Promise.all(people.map((person: User) => getPerson(person)));
}
