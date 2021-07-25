import {
  addArrayFilter,
  addOptionsFilter,
  addStringFilter,
} from 'lib/api/search';
import { getDate, sliceAvailability } from 'lib/utils/time';
import { Availability } from 'lib/model/availability';
import { Timeslot } from 'lib/model/timeslot';
import { User } from 'lib/model/user';
import { UsersQuery } from 'lib/model/query/users';
import logger from 'lib/api/logger';
import supabase from 'lib/api/supabase';

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

export default async function getUsers(
  query: UsersQuery
): Promise<{ hits: number; results: User[] }> {
  const { data, count } = await supabase
    .from<User>('users')
    .select('*', { count: 'exact' })
    .overlaps('parents', query.parents)
    .overlaps('orgs', query.orgs)
    .overlaps('tags', query.tags)
    .overlaps(`${query.aspect}->subjects` as keyof User, query.subjects)
    .overlaps('langs', query.langs)
    .range(
      query.hitsPerPage * query.page, 
      query.hitsPerPage * (query.page + 1)
    );
  debugger;
  return { hits: count || 0, results: data || [] }; 
}
