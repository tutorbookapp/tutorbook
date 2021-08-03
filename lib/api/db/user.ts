import {
  DBRelationOrg,
  DBRelationParent,
  DBUser,
  DBViewUser,
  User,
} from 'lib/model/user';
import { getAlgoliaAvailability, sliceAvailability } from 'lib/utils/time';
import { APIError } from 'lib/api/error';
import { Availability } from 'lib/model/availability';
import { MeetingsQuery } from 'lib/model/query/meetings';
import { UsersQuery } from 'lib/model/query/users';
import { getMeetings } from 'lib/api/db/meeting';
import supabase from 'lib/api/supabase';

async function times(user: User): Promise<number[]> {
  const query = new MeetingsQuery({
    people: [{ label: user.name, value: user.id }],
    to: new Date(new Date().getFullYear(), new Date().getMonth() + 3),
    from: new Date(),
  });
  const meetings = (await getMeetings(query)).results;
  const booked = new Availability(...meetings.map((m) => m.time));
  return getAlgoliaAvailability(user.availability, booked, query.to);
}

export async function createUser(user: User): Promise<User> {
  const { data, error } = await supabase
    .from<DBUser>('users')
    .insert({ ...user.toDB(), times: await times(user) });
  if (error) {
    const msg = `Error saving user (${user.toString()}) in database`;
    throw new APIError(`${msg}: ${error.message}`, 500);
  }
  const parents = user.parents.map((p) => ({ parent: p, user: user.id }));
  const { error: err } = await supabase
    .from<DBRelationParent>('relation_parents')
    .insert(parents);
  if (err) {
    const msg = `Error saving parents for user (${user.name}) in database`;
    throw new APIError(`${msg}: ${err.message}`, 500);
  }
  const orgs = user.orgs.map((o) => ({ org: o, user: user.id }));
  const { error: e } = await supabase
    .from<DBRelationOrg>('relation_orgs')
    .insert(orgs);
  if (e) {
    const msg = `Error saving orgs for user (${user.name}) in database`;
    throw new APIError(`${msg}: ${e.message}`, 500);
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
  // TODO: Order by multiple attributes to show featured results first.
  let select = supabase
    .from<DBViewUser>('view_users')
    .select('*', { count: 'exact' })
    .contains('tags', query.tags)
    .contains(
      'langs',
      query.langs.map((s) => s.value)
    )
    .contains(
      query.aspect,
      query.subjects.map((s) => s.value)
    )
    .ilike('name', `%${query.search}%`)
    .order('id', { ascending: false })
    .range(
      query.hitsPerPage * query.page,
      query.hitsPerPage * (query.page + 1) - 1
    );
  if (typeof query.visible === 'boolean')
    select = select.eq('visible', query.visible);
  if (query.parents.length) select = select.overlaps('parents', query.parents);
  if (query.orgs.length) select = select.overlaps('orgs', query.orgs);
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
  if (query.available && !query.availability.length) {
    // If `query.available` is true, we only show results that have at least one
    // available time (even if `query.availability` is empty).
    select = select.eq('available', true);
  } else if (query.availability.length) {
    // TODO: There is probably a bigger limitation here than with Algolia. I bet
    // I won't be able to filter by all ~600 slices for a full availability.
    const sliced = sliceAvailability(query.availability);
    const nums = sliced.map((t) => t.from.valueOf());
    select = select.overlaps('times', nums);
  }
  const { data, count } = await select;
  const results = (data || []).map((u) => User.fromDB(u));
  return { results, hits: count || results.length };
}

export async function updateUser(user: User): Promise<void> {
  const { error } = await supabase
    .from<DBUser>('users')
    .upsert({ ...user.toDB(), times: await times(user) }, { onConflict: 'id' })
    .eq('id', user.id);
  if (error) {
    const msg = `Error updating user (${user.toString()}) in database`;
    throw new APIError(`${msg}: ${error.message}`, 500);
  }
  await Promise.all(
    user.parents.map(async (p) => {
      await supabase
        .from<DBRelationParent>('relation_parents')
        .update({ parent: p, user: user.id })
        .eq('parent', p)
        .eq('user', user.id);
    })
  );
  await Promise.all(
    user.orgs.map(async (o) => {
      await supabase
        .from<DBRelationOrg>('relation_orgs')
        .update({ org: o, user: user.id })
        .eq('org', o)
        .eq('user', user.id);
    })
  );
}

export async function deleteUser(uid: string): Promise<void> {
  const { error } = await supabase.from<DBUser>('users').delete().eq('id', uid);
  if (error) {
    const msg = `Error deleting user (${uid}) from database`;
    throw new APIError(`${msg}: ${error.message}`, 500);
  }
}
