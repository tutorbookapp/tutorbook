import { DBUser, DBRelationOrg, DBRelationMember, User } from 'lib/model/user';
import { APIError } from 'lib/api/error';
import { UsersQuery } from 'lib/model/query/users';
import supabase from 'lib/api/supabase';

export async function createUser(user: User): Promise<User> {
  const { data, error } = await supabase
    .from<DBUser>('users')
    .insert(user.toDB());
  if (error) {
    const msg = `Error saving user (${user.toString()}) in database`;
    throw new APIError(`${msg}: ${error.message}`, 500);
  }
  return data ? User.fromDB(data[0]) : user;
}

export async function getUser(uid: string): Promise<User> {
  const { data } = await supabase.from<DBUser>('users').select().eq('id', uid);
  if (!data || !data[0])
    throw new APIError(`User (${uid}) does not exist`, 400);
  return User.fromDB(data[0]);
}

export async function getUsers(
  query: UsersQuery
): Promise<{ hits: number; results: User[] }> {
  // TODO: Figure out how to perform JOIN queries with the `relation_orgs` and
  // `relation_parents` tables. See: https://git.io/J4IPY
  // TODO: Setup availability indexing and filtering using PostgreSQL.
  // TODO: Order by multiple attributes to show featured results first.
  const { data, count } = await supabase
    .from<DBUser>('users')
    .select('*', { count: 'exact' })
    .contains('tags', query.tags)
    .contains(
      query.aspect,
      query.subjects.map((s) => s.value)
    )
    .contains(
      'langs',
      query.langs.map((s) => s.value)
    )
    .eq('visible', query.visible)
    .order('id', { ascending: false }) // Show newer people first.
    .range(
      query.hitsPerPage * query.page + 1,
      query.hitsPerPage * (query.page + 1)
    );
  const results = (data || []).map((u) => User.fromDB(u));
  return { results, hits: count || results.length };
}

export async function updateUser(user: User): Promise<void> {
  const { error } = await supabase
    .from<DBUser>('users')
    .upsert(user.toDB(), { onConflict: 'id' })
    .eq('id', user.id);
  if (error) {
    const msg = `Error updating user (${user.toString()}) in database`;
    throw new APIError(`${msg}: ${error.message}`, 500);
  }
}

export async function deleteUser(uid: string): Promise<void> {
  const { error } = await supabase.from<DBUser>('users').delete().eq('id', uid);
  if (error) {
    const msg = `Error deleting user (${uid}) from database`;
    throw new APIError(`${msg}: ${error.message}`, 500);
  }
}
