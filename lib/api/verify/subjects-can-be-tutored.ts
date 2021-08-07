import { APIError } from 'lib/model/error';
import { User } from 'lib/model/user';

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
  people: User[]
): void {
  people.forEach((person: User) => {
    const isTutor = person.roles.includes('tutor');
    const canTutor = (s: string) => person.subjects.includes(s);
    if (isTutor && !subjects.every(canTutor))
      throw new APIError(`${person.toString()} cannot tutor these subjects`);
  });
}
