import { User } from 'lib/model/user';

/**
 * Gets the students from an array of people.
 * @param people - The array from which to extract the student profiles.
 * @return The students (i.e. the people in the given `people` array whose roles
 * include either `tutee` or `mentee`).
 */
export default function getStudents(people: User[]): User[] {
  return people.filter((person: User) => {
    return person.roles.includes('tutee') || person.roles.includes('mentee');
  });
}
