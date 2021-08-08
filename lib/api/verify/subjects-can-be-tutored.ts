import { APIError } from 'lib/model/error';
import { User } from 'lib/model/user';

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
