import { APIError } from 'lib/model/error';
import { Subject } from 'lib/model/subject';
import { User } from 'lib/model/user';

export default function verifySubjectsCanBeTutored(
  subjects: Subject[],
  people: User[]
): void {
  people.forEach((p) => {
    if (!p.roles.includes('tutor')) return;
    if (subjects.every((s) => p.subjects.some((o) => o.id === s.id))) return;
    throw new APIError(`${p.toString()} cannot tutor these subjects`);
  });
}
