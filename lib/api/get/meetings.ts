import { Meeting, MeetingsQuery } from 'lib/model';
import { addOptionsFilter, addStringFilter, list } from 'lib/api/search';

function getFilterStrings(query: MeetingsQuery): string[] {
  let str = query.org ? `org:${query.org}` : '';
  str = addOptionsFilter(str, query.people, 'people.id', 'OR');

  const to = query.to.valueOf();
  const from = query.from.valueOf();

  return [
    // Meeting time overlaps with top of query (start is bfore query start).
    addStringFilter(str, `(time.to > ${from} AND time.from <= ${from})`),
    // Meeting time is contained within query (start is after and end before).
    addStringFilter(str, `(time.to <= ${to} AND time.from >= ${from})`),
    // Meeting time overlaps with bottom of query (end is after query end).
    addStringFilter(str, `(time.from < ${to} AND time.to >= ${to})`),
  ];
}

export default async function getMeetings(
  query: MeetingsQuery
): Promise<{ hits: number; results: Meeting[] }> {
  const filters = getFilterStrings(query);
  console.log('Filtering meetings by strings:', filters);
  return list('meetings', query, Meeting.fromSearchHit, filters);
}
