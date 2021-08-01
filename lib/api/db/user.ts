import {
  addArrayFilter,
  addOptionsFilter,
  addStringFilter,
} from 'lib/api/search';
import { getDate, sliceAvailability } from 'lib/utils/time';
import { APIError } from 'lib/api/error';
import { Availability } from 'lib/model/availability';
import { Timeslot } from 'lib/model/timeslot';
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
  exdates: Date[];
  recur: string;
  last: Date;
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
interface DBRelationParent {
  user: string;
  parent: string;
}
interface DBRelationOrg {
  user: string;
  org: string;
}

export async function createUser(user: User): Promise<User> {
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

export async function getUser(uid: string): Promise<User> {
  const { data } = await supabase.from('users').select().eq('id', uid);
  if (!data || !data[0])
    throw new APIError(`User (${uid}) does not exist`, 400);
  return User.parse(data[0]);
}

function getFilterString(query: UsersQuery): string {
  let str = '';
  if (typeof query.visible === 'boolean')
    str = addStringFilter(str, `visible=${query.visible ? 1 : 0}`);
  str = addArrayFilter(str, query.parents, 'parents', 'OR');
  str = addArrayFilter(str, query.orgs, 'orgs', 'OR');
  str = addArrayFilter(str, query.tags, '_tags');
  str = addOptionsFilter(str, query.subjects, `${query.aspect}.subjects`);
  str = addOptionsFilter(str, query.langs, 'langs');

  // Filtering by availability shows volunteers that the student can book. In
  // other (more technical) terms, we show volunteers who have at least one
  // hour-long timeslot within the student's availability in the next 3 months
  // (because we allow booking 3 months ahead with our `TimeSelect`).
  //
  // TODO: Perhaps use a more useful 2-3 week window instead of 3 months.
  //
  // Most of the heavy lifting for this feature is done at index time:
  // 1. Generate an array of hour-long timeslot start times for a week (these
  //    are stored as strings with weekday and time data only).
  //    - Slice the volunteer's availability to get start times.
  //    - Exclude a time when the volunteer has meetings for every instance of
  //      that time in the next 3 months (e.g. if a volunteer has a meeting on
  //      every Monday at 11 AM for the next 3 months, then we exclude Mondays
  //      at 11 AM from the volunteer's availability).
  // 2. At search time, filter by results that contain any of the hour-long
  //    timeslot start times within the student's requested availability.
  const full = Availability.parse([]);
  const days = Array(7).fill(null);
  days.forEach((_, day) => {
    full.push(Timeslot.parse({ from: getDate(day, 0), to: getDate(day, 24) }));
  });
  const fallback = query.available ? full : Availability.parse([]);
  const baseline = query.availability.length ? query.availability : fallback;
  const filtering = sliceAvailability(baseline).map((t) => t.from.valueOf());
  return addArrayFilter(str, filtering, '_availability', 'OR');
}

export async function getUsers(
  query: UsersQuery
): Promise<{ hits: number; results: User[] }> {
  // TODO: Figure out how to perform JOIN queries with the `relation_orgs` and
  // `relation_parents` tables. See: https://git.io/J4IPY
  // TODO: Setup availability indexing and filtering using PostgreSQL.
  // TODO: Order by multiple attributes to show featured results first.
  const { data, count } = await supabase
    .from<User>('users')
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
  const results = (data || []).map((u) => User.parse(u));
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
    .from('users')
    .upsert(copy, { onConflict: 'id' })
    .eq('id', user.id);
  if (error) {
    const msg = `Error updating user (${user.toString()}) in database`;
    throw new APIError(`${msg}: ${error.message}`, 500);
  }
}

export async function deleteUser(uid: string): Promise<void> {
  const { error } = await supabase.from('users').delete().eq('id', uid);
  if (error) {
    const msg = `Error deleting user (${uid}) from database`;
    throw new APIError(`${msg}: ${error.message}`, 500);
  }
}
