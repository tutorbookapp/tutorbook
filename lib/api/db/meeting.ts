import { RRule, RRuleSet } from 'rrule';
import { nanoid } from 'nanoid';

import {
  DBMeeting,
  DBRelationMeetingPerson,
  DBViewMeeting,
  Meeting,
} from 'lib/model/meeting';
import { APIError } from 'lib/api/error';
import { MeetingsQuery } from 'lib/model/query/meetings';
import { Timeslot } from 'lib/model/timeslot';
import supabase from 'lib/api/supabase';

export async function createMeeting(meeting: Meeting): Promise<Meeting> {
  const { data, error } = await supabase
    .from<DBMeeting>('meetings')
    .insert({ ...meeting.toDB(), id: undefined });
  if (error) {
    const msg = `Error saving meeting (${meeting.toString()}) to database`;
    throw new APIError(`${msg}: ${error.message}`, 500);
  }
  const people: DBRelationMeetingPerson[] = meeting.match.people.map((p) => ({
    user: p.id,
    roles: p.roles,
    meeting: data ? data[0].id : Number(meeting.id),
  }));
  const { error: e } = await supabase
    .from<DBRelationMeetingPerson>('relation_meeting_people')
    .insert(people);
  if (e) {
    const msg = `Error saving people (${JSON.stringify(people)}) to database`;
    throw new APIError(`${msg}: ${e.message}`, 500);
  }
  return data ? Meeting.fromDB(data[0]) : meeting;
}

export async function getMeeting(id: string): Promise<Meeting> {
  const { data } = await supabase
    .from<DBViewMeeting>('view_meetings')
    .select()
    .eq('id', Number(id));
  if (!data || !data[0])
    throw new APIError(`Meeting (${id}) does not exist in database`);
  return Meeting.fromDB(data[0]);
}

export async function getMeetings(
  query: MeetingsQuery
): Promise<{ hits: number; results: Meeting[] }> {
  const to = query.to.toISOString();
  const from = query.from.toISOString();
  const endWithin = `time_last.gte.${from},time_last.lte.${to}`;
  const startWithin = `time_from.gte.${from},time_from.lte.${to}`;
  let select = supabase
    .from<DBViewMeeting>('view_meetings')
    .select()
    .contains('subjects', query.subjects)
    .contains('tags', query.tags)
    .or(
      [
        `and(time_from.lt.${from},${endWithin})`,
        `and(${startWithin},${endWithin})`,
        `and(time_last.gt.${to},${startWithin})`,
        `and(time_from.lt.${from},time_last.gt.${to})`,
      ].join(',')
    );
  if (query.org) select = select.eq('org', query.org);
  if (query.people.length) {
    const peopleIds = query.people.map((p) => p.value);
    select = select.overlaps('people_ids', peopleIds);
  }
  const { data, count } = await select;
  let hits = count || (data || []).length;
  const meetings = (data || [])
    .map((m) => Meeting.fromDB(m))
    .map((meeting) => {
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
        const endTime = new Date(startTime.valueOf() + meeting.time.duration);
        return new Meeting({
          ...meeting,
          id: nanoid(),
          parentId: meeting.id,
          time: new Timeslot({ ...meeting.time, from: startTime, to: endTime }),
        });
      });
    });
  return { hits, results: meetings.flat() };
}

export async function getMeetingsByMatchId(
  matchId: string
): Promise<Meeting[]> {
  const { data, error } = await supabase
    .from<DBMeeting>('meetings')
    .select()
    .eq('match', Number(matchId));
  if (error)
    throw new APIError(
      `Error fetching meetings by match (${matchId}): ${error.message}`
    );
  return (data || []).map((d) => Meeting.fromDB(d));
}

export async function updateMeeting(meeting: Meeting): Promise<void> {
  const { error } = await supabase
    .from<DBMeeting>('meetings')
    .update({ ...meeting.toDB(), id: undefined })
    .eq('id', Number(meeting.id));
  if (error) {
    const m = `Error updating meeting (${meeting.toString()}) in database`;
    throw new APIError(`${m}: ${error.message}`, 500);
  }
}

export async function deleteMeeting(meetingId: string): Promise<void> {
  const { error } = await supabase
    .from<DBMeeting>('meetings')
    .delete()
    .eq('id', Number(meetingId));
  if (error) {
    const msg = `Error deleting meeting (${meetingId}) from database`;
    throw new APIError(`${msg}: ${error.message}`, 500);
  }
}
