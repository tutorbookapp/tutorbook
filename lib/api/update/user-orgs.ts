import { User } from 'lib/model';
import clone from 'lib/utils/clone';

export default function updateUserOrgs(user: User): User {
  const updated = new User(clone(user));
  if (!updated.orgs.length) updated.orgs.push('default');
  return updated;
}
