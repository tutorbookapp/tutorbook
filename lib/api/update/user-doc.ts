import { APIError } from 'lib/api/error';
import { User } from 'lib/model/user';
import clone from 'lib/utils/clone';
import supabase from 'lib/api/supabase';

export default async function updateUserDoc(user: User): Promise<void> {
  // TODO: Insert these relations into the proper relation table.
  const copy: Partial<User> = clone(user);
  delete copy.orgs;
  delete copy.roles;
  delete copy.parents;
  const { error } = await supabase.from('users').update(copy).eq('id', user.id);
  if (error) {
    const msg = `Error updating user (${user.toString()}) in database`;
    throw new APIError(`${msg}: ${error.message}`, 500);
  }
}
