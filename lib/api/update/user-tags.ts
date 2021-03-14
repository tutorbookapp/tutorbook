import { User, UserTag } from 'lib/model/user';
import clone from 'lib/utils/clone';

export default function updateUserTags(
  user: User,
  actions?: { add?: UserTag[]; remove?: UserTag[] }
): User {
  const tags = new Set<UserTag>(user.tags);

  if (user.mentoring.subjects.length || user.roles.includes('mentor'))
    tags.add('mentor');
  if (user.mentoring.searches.length || user.roles.includes('mentee'))
    tags.add('mentee');
  if (user.tutoring.subjects.length || user.roles.includes('tutor'))
    tags.add('tutor');
  if (user.tutoring.searches.length || user.roles.includes('tutee'))
    tags.add('tutee');

  if (user.verifications.length) tags.add('vetted');
  if (!user.verifications.length) tags.delete('vetted');

  actions?.add?.forEach((tag) => tags.add(tag));
  actions?.remove?.forEach((tag) => tags.delete(tag));

  return new User(clone({ ...user, tags: [...tags] }));
}
