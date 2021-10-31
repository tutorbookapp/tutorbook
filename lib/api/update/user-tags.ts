import { User, UserTag } from 'lib/model/user';
import clone from 'lib/utils/clone';

export default function updateUserTags(
  user: User,
  actions?: { add?: UserTag[]; remove?: UserTag[] }
): User {
  const tags = new Set<UserTag>([...user.tags, ...user.roles]);

  if (user.subjects.length) tags.add('tutor');

  actions?.add?.forEach((tag) => tags.add(tag));
  actions?.remove?.forEach((tag) => tags.delete(tag));

  return new User(clone({ ...user, tags: [...tags] }));
}
