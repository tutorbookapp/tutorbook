import { User, UserTag } from 'lib/model/user';
import clone from 'lib/utils/clone';

export default function updateUserTags(
  user: User,
  actions?: { add?: UserTag[]; remove?: UserTag[] }
): User {
  const tags = new Set<UserTag>([...user.tags, ...user.roles]);

  if (user.mentoring.length) tags.add('mentor');
  if (user.tutoring.length) tags.add('tutor');

  if (user.verifications.length) tags.add('vetted');
  if (!user.verifications.length) tags.delete('vetted');

  actions?.add?.forEach((tag) => tags.add(tag));
  actions?.remove?.forEach((tag) => tags.delete(tag));

  return User.parse(clone({ ...user, tags: [...tags] }));
}
