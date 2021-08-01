import { APIError } from 'lib/api/error';
import { User } from 'lib/model/user';
import { UsersQuery } from 'lib/model/query/users';
import clone from 'lib/utils/clone';
import supabase from 'lib/api/supabase';

export type DBAspect = 'mentoring' | 'tutoring';
export interface DBSocial {
  type:
    | 'website'
    | 'linkedin'
    | 'twitter'
    | 'facebook'
    | 'instagram'
    | 'github'
    | 'indiehackers';
  url: string;
}
export interface DBTimeslot {
  id: string;
  from: Date;
  to: Date;
  exdates: Date[] | null;
  recur: string | null;
  last: Date | null;
}
export interface DBUser {
  id: string;
  uid: string | null;
  name: string;
  photo: string | null;
  email: string | null;
  phone: string | null;
  bio: string;
  background: string | null;
  venue: string | null;
  socials: DBSocial[];
  availability: DBTimeslot[];
  mentoring: string[];
  tutoring: string[];
  langs: string[];
  visible: boolean;
  featured: DBAspect[];
  reference: string;
  timezone: string | null;
  age: number | null;
  tags: (
    | 'vetted'
    | 'matched'
    | 'meeting'
    | 'tutor'
    | 'tutee'
    | 'mentor'
    | 'mentee'
    | 'parent'
  )[];
  created: Date;
  updated: Date;
}
export interface DBRelationParent {
  user: string;
  parent: string;
}
export interface DBRelationOrg {
  user: string;
  org: string;
}

export async function createUser(user: User): Promise<User> {
  const { data, error } = await supabase.from<DBUser>('users').insert({
    id: user.id,
    name: user.name,
    photo: user.photo || null,
    email: user.email || null,
    phone: user.phone || null,
    bio: user.bio,
    background: user.background || null,
    venue: user.venue || null,
    socials: user.socials,
    availability: user.availability.map((t) => ({
      id: t.id,
      from: t.from,
      to: t.to,
      exdates: t.exdates || null,
      recur: t.recur || null,
      last: t.last || null,
    })),
    mentoring: user.mentoring.subjects,
    tutoring: user.tutoring.subjects,
    langs: user.langs,
    visible: user.visible,
    featured: user.featured,
    reference: user.reference,
    timezone: user.timezone || null,
    age: user.age || null,
    tags: user.tags,
    created: user.created,
    updated: user.updated,
  });
  if (error) {
    const msg = `Error saving user (${user.toString()}) in database`;
    throw new APIError(`${msg}: ${error.message}`, 500);
  }
  return new User(data ? data[0] : user);
}

export async function getUser(uid: string): Promise<User> {
  const { data } = await supabase.from<DBUser>('users').select().eq('id', uid);
  if (!data || !data[0])
    throw new APIError(`User (${uid}) does not exist`, 400);
  return new User(data[0]);
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
  const results = (data || []).map((u) => new User(u));
  return { results, hits: count || results.length };
}

export async function updateUser(user: User): Promise<void> {
  // TODO: Insert these relations into the proper relation table.
  const copy: Partial<User> = clone(user);
  delete copy.orgs;
  delete copy.roles;
  delete copy.parents;
  delete copy.verifications;
  const { error } = await supabase
    .from<DBUser>('users')
    .upsert(copy, { onConflict: 'id' })
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
