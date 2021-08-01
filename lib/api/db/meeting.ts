import { RRule, RRuleSet } from 'rrule';
import { nanoid } from 'nanoid';

import {
  addArrayFilter,
  addOptionsFilter,
  addStringFilter,
  list,
} from 'lib/api/search';
import { Meeting } from 'lib/model/meeting';
import { MeetingsQuery } from 'lib/model/query/meetings';
import { Timeslot } from 'lib/model/timeslot';
import { getDuration } from 'lib/utils/time';

function getFilterStrings(query: MeetingsQuery): string[] {
  let str = query.org ? `match.org:${query.org}` : '';
  str = addOptionsFilter(str, query.people, 'match.people.id', 'OR');
  str = addOptionsFilter(str, query.subjects, 'match.subjects', 'OR');
  str = addArrayFilter(str, query.tags, '_tags');

  const to = query.to.valueOf();
  const from = query.from.valueOf();

  const endWithin = `time.last >= ${from} AND time.last <= ${to}`;
  const startWithin = `time.from >= ${from} AND time.from <= ${to}`;

  return [
    // Start is before window but end is within.
    addStringFilter(str, `(time.from < ${from} AND ${endWithin})`),
    // Both start and end are within window.
    addStringFilter(str, `(${startWithin} AND ${endWithin})`),
    // End is after window but start is within.
    addStringFilter(str, `(time.last > ${to} AND ${startWithin})`),
    // Start is before window and end is after.
    addStringFilter(str, `(time.from < ${from} AND time.last > ${to})`),
  ];
}

// TODO: Generate instance meetings (from recurring parent meetings returned by
// query) within requested time window and send those to the client.
export default async function getMeetings(
  query: MeetingsQuery
): Promise<{ hits: number; results: Meeting[] }> {
  const filters = getFilterStrings(query);
  const data = await list('meetings', query, Meeting.parse, filters);
  let { hits } = data;
  const meetings = data.results.map((meeting) => {
    if (!meeting.time.recur) return [meeting];
    const options = RRule.parseString(meeting.time.recur);
    const rruleset = new RRuleSet();
    rruleset.rrule(new RRule({ ...options, dtstart: meeting.time.from }));
    (meeting.time.exdates || []).forEach((d) => rruleset.exdate(d));
    // TODO: What if meeting instance starts before window but end is within?
    const startTimes = rruleset.between(query.from, query.to);
    hits += startTimes.length - 1;
    return startTimes.map((startTime) => {
      if (startTime.valueOf() === meeting.time.from.valueOf()) return meeting;
      const to = new Date(startTime.valueOf() + getDuration(meeting.time));
      return Meeting.parse({
        ...meeting,
        id: nanoid(),
        parentId: meeting.id,
        time: Timeslot.parse({ ...meeting.time, to, from: startTime }),
      });
    });
  });
  return { hits, results: meetings.flat() };
}

import { APIError } from 'lib/api/error';
import { Meeting } from 'lib/model/meeting';
import supabase from 'lib/api/supabase';

interface DBMeeting {
  id: number;
  org: string;
  creator: string;
  subjects: string[];
  status: 'created' | 'pending' | 'logged' | 'approved';
  match: number;
  venue: string;
  time: DBTimeslot;
  description: string;
  tags: 'recurring'[];
  created: Date;
  updated: Date;
}

export default async function getMeeting(id: string): Promise<Meeting> {
  const { data } = await supabase
    .from<Meeting>('meetings')
    .select()
    .eq('id', id);
  if (!data || !data[0])
    throw new APIError(`Meeting (${id}) does not exist in database`);
  return Meeting.parse(data[0]);
}

import { APIError } from 'lib/api/error';
import supabase from 'lib/api/supabase';

export default async function deleteMeetingDoc(
  meetingId: string
): Promise<void> {
  const { error } = await supabase
    .from('meetings')
    .delete()
    .eq('id', meetingId);
  if (error) {
    const msg = `Error deleting meeting (${meetingId}) from database`;
    throw new APIError(`${msg}: ${error.message}`, 500);
  }
}

import { APIError } from 'lib/api/error';
import { Meeting } from 'lib/model/meeting';
import clone from 'lib/utils/clone';
import supabase from 'lib/api/supabase';

export default async function createMeetingDoc(
  meeting: Meeting
): Promise<Meeting> {
  const copy: Partial<Meeting> = clone(meeting);
  delete copy.people;
  delete copy.id;
  copy.match = meeting.match.id;
  copy.creator = meeting.creator.id;
  const { data, error } = await supabase.from<Meeting>('meetings').insert(copy);
  if (error) {
    const msg = `Error saving meeting (${meeting.toString()}) to database`;
    throw new APIError(`${msg}: ${error.message}`, 500);
  }
  const people = meeting.people.map((p) => ({
    user: p.id,
    roles: p.roles,
    meeting: data ? data[0].id : meeting.id,
  }));
  const { error: e } = await supabase.from('relation_people').insert(people);
  if (e) {
    const msg = `Error saving people (${JSON.stringify(people)}) to database`;
    throw new APIError(`${msg}: ${e.message}`, 500);
  }
  return Meeting.parse({
    ...(data ? data[0] : meeting),
    match: meeting.match,
    people: meeting.people,
    creator: meeting.creator,
  });
}
