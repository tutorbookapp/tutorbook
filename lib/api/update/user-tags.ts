import { User, UserTag } from 'lib/model/user';
import clone from 'lib/utils/clone';

export default function updateUserTags(user: User): User {
  const tags: UserTag[] = [];

  // Role tags are never removed: once a user has been a tutor at least once,
  // they will always be considered a tutor.
  if (user.mentoring.subjects.length || user.tags.includes('mentor'))
    tags.push('mentor');
  if (user.mentoring.searches.length || user.tags.includes('mentee'))
    tags.push('mentee');
  if (user.tutoring.subjects.length || user.tags.includes('tutor'))
    tags.push('tutor');
  if (user.tutoring.searches.length || user.tags.includes('tutee'))
    tags.push('tutee');

  if (user.verifications.length) tags.push('vetted');

  return new User(clone({ ...user, tags }));
}
