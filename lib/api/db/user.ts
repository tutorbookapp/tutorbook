import { APIError } from 'lib/api/error';
import { User } from 'lib/model/user';
import clone from 'lib/utils/clone';
import supabase from 'lib/api/supabase';

export default async function createUserDoc(user: User): Promise<User> {
  // TODO: Insert these relations into the proper relation table.
  const copy: Partial<User> = clone(user);
  delete copy.orgs;
  delete copy.roles;
  delete copy.parents;
  delete copy.verifications;
  const { data, error } = await supabase.from('users').insert(copy);
  if (error) {
    const msg = `Error saving user (${user.toString()}) in database`;
    throw new APIError(`${msg}: ${error.message}`, 500);
  }
  return User.parse(data ? data[0] : user);
}
