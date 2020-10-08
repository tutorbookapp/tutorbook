import { UserWithRoles } from 'lib/model';

/**
 * Gets the students from an array of people.
 * @param people - The array from which to extract the student profiles.
 * @return The students (i.e. the people in the given `people` array whose roles
 * include either `tutee` or `mentee`).
 */
export default function getStudents(people: UserWithRoles[]): UserWithRoles[] {
  return people.filter((person: UserWithRoles) => {
    return person.roles.includes('tutee') || person.roles.includes('mentee');
  });
}
