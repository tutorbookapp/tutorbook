import { RRule, RRuleSet } from 'rrule';
import { nanoid } from 'nanoid';

import {
  DBMeeting,
  DBRelationMeetingPerson,
  DBViewMeeting,
  Meeting,
} from 'lib/model/meeting';
import { APIError } from 'lib/model/error';
import { MeetingsQuery } from 'lib/model/query/meetings';
import { Timeslot } from 'lib/model/timeslot';
import handle from 'lib/api/db/error';
import logger from 'lib/api/logger';
import supabase from 'lib/api/supabase';

export async function createMeeting(meeting: Meeting): Promise<Meeting> {
  logger.verbose(`Inserting meeting (${meeting.toString()}) row...`);
  const { data, error } = await supabase
    .from<DBMeeting>('meetings')
    .insert({ ...meeting.toDB(), id: undefined });
  handle('creating', 'meeting', meeting, error);
  const m = data ? Meeting.fromDB(data[0]) : meeting;
  const people: DBRelationMeetingPerson[] = meeting.match.people.map((p) => ({
    user: p.id,
    roles: p.roles,
    meeting: Number(m.id),
  }));
  logger.verbose(`Inserting people (${JSON.stringify(people)}) rows...`);
  const { error: err } = await supabase
    .from<DBRelationMeetingPerson>('relation_meeting_people')
    .insert(people);
  handle('creating', 'meeting people', people, err);
  return m;
}

export async function updateMeeting(meeting: Meeting): Promise<Meeting> {
  logger.verbose(`Updating meeting (${meeting.toString()}) row...`);
  const { data, error } = await supabase
    .from<DBMeeting>('meetings')
    .update({ ...meeting.toDB(), id: undefined })
    .eq('id', Number(meeting.id));
  handle('updating', 'meeting', meeting, error);
  const m = data ? Meeting.fromDB(data[0]) : meeting;
  const people: DBRelationMeetingPerson[] = meeting.match.people.map((p) => ({
    user: p.id,
    roles: p.roles,
    meeting: Number(m.id),
  }));
  logger.verbose(`Upserting people (${JSON.stringify(people)}) rows...`);
  const { error: err } = await supabase
    .from<DBRelationMeetingPerson>('relation_meeting_people')
    .upsert(people, { onConflict: 'user,meeting,roles' });
  handle('updating', 'meeting people', people, err);
  return m;
}

export async function deleteMeeting(id: string): Promise<Meeting> {
  const { data, error } = await supabase
    .from<DBMeeting>('meetings')
    .delete()
    .eq('id', Number(id));
  handle('deleting', 'meeting', id, error);
  return data ? Meeting.fromDB(data[0]) : new Meeting({ id });
}

export async function getMeeting(id: string): Promise<Meeting> {
  const { data, error } = await supabase
    .from<DBViewMeeting>('view_meetings')
    .select()
    .eq('id', Number(id));
  handle('getting', 'meeting', id, error);
  if (!data?.length) throw new APIError(`Meeting (${id}) does not exist`, 404);
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
  const { data, error, count } = await select;
  handle('getting', 'meetings', query, error);
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
    .from<DBViewMeeting>('view_meetings')
    .select()
    .eq('match', Number(matchId));
  handle('getting', 'meetings by match', matchId, error);
  return (data || []).map((d) => Meeting.fromDB(d));
}
