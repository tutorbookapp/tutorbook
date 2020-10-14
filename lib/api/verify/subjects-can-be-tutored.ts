import { APIError } from 'lib/api/error';
import { UserWithRoles } from 'lib/model';

/**
 * Verifies that the given subjects can be tutored/mentored by all the mentors
 * and tutors included in the given people.
 * @param subjects - The subjects to verify.
 * @param people - The people that should be able to tutor/mentor the given
 * subjects (depending on their role).
 * @return Nothing; throws an `APIError` if a tutor or mentor (included in the
 * given `people`). isn't able to tutor/mentor the given `subjects`.
 * @todo Rename this function so it doesn't seem exclusive for tutoring.
 */
export default function verifySubjectsCanBeTutored(
  subjects: string[],
  people: UserWithRoles[]
): void {
  people.forEach((person: UserWithRoles) => {
    const isTutor = person.roles.indexOf('tutor') >= 0;
    const isMentor = person.roles.indexOf('mentor') >= 0;
    const canTutor = (s: string) => person.tutoring.subjects.includes(s);
    const canMentor = (s: string) => person.mentoring.subjects.includes(s);
    if (isTutor && !subjects.every(canTutor))
      throw new APIError(`${person.toString()} cannot tutor these subjects`);
    if (isMentor && !subjects.every(canMentor))
      throw new APIError(`${person.toString()} cannot mentor these subjects`);
  });
}
