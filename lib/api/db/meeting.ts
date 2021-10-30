import { RRule, RRuleSet } from 'rrule';

import {
  DBMeeting,
  DBRelationMeetingSubject,
  DBRelationPerson,
  DBViewMeeting,
  Meeting,
} from 'lib/model/meeting';
import { APIError } from 'lib/model/error';
import { MeetingsQuery } from 'lib/model/query/meetings';
import { Timeslot } from 'lib/model/timeslot';
import handle from 'lib/api/db/error';
import logger from 'lib/api/logger';
import numid from 'lib/utils/numid';
import supabase from 'lib/api/supabase';

export async function createMeeting(meeting: Meeting): Promise<Meeting> {
  logger.debug(`Inserting meeting (${meeting.toString()}) row...`);
  const { data, error } = await supabase
    .from<DBMeeting>('meetings')
    .insert({ ...meeting.toDB(), id: undefined });
  handle('creating', 'meeting', meeting, error);
  const m = data ? Meeting.fromDB(data[0]) : meeting;
  const subjects: DBRelationMeetingSubject[] = meeting.subjects.map((s) => ({
    subject: s.id,
    meeting: m.id,
  }));
  logger.debug(`Inserting subjects (${JSON.stringify(subjects)}) rows...`);
  const { error: err } = await supabase
    .from<DBRelationMeetingSubject>('relation_meeting_subjects')
    .insert(subjects);
  handle('creating', 'meeting subjects', subjects, err);
  const people: DBRelationPerson[] = meeting.people.map((p) => ({
    user: p.id,
    roles: p.roles,
    meeting: m.id,
  }));
  logger.debug(`Inserting people (${JSON.stringify(people)}) rows...`);
  const { error: e } = await supabase
    .from<DBRelationPerson>('relation_people')
    .insert(people);
  handle('creating', 'meeting people', people, e);
  return new Meeting({ ...m, people: meeting.people, creator: meeting.creator });
}

export async function updateMeeting(meeting: Meeting): Promise<Meeting> {
  logger.debug(`Updating meeting (${meeting.toString()}) row...`);
  const { data, error } = await supabase
    .from<DBMeeting>('meetings')
    .update({ ...meeting.toDB(), id: undefined })
    .eq('id', meeting.id);
  handle('updating', 'meeting', meeting, error);
  const m = data ? Meeting.fromDB(data[0]) : meeting;
  
  const subjects: DBRelationMeetingSubject[] = meeting.subjects.map((s) => ({
    subject: s.id,
    meeting: m.id,
  }));
  logger.debug(`Replacing subjects (${JSON.stringify(subjects)}) rows...`);
  const { error: deleteSubjectsErr } = await supabase
    .from<DBRelationMeetingSubject>('relation_meeting_subjects')
    .delete()
    .eq('meeting', m.id);
  handle('deleting', 'meeting subjects', subjects, deleteSubjectsErr);
  const { error: insertSubjectsErr } = await supabase
    .from<DBRelationMeetingSubject>('relation_meeting_subjects')
    .insert(subjects);
  handle('inserting', 'meeting subjects', subjects, insertSubjectsErr);
  
  const people: DBRelationPerson[] = meeting.people.map((p) => ({
    user: p.id,
    roles: p.roles,
    meeting: m.id,
  }));
  logger.debug(`Replacing people (${JSON.stringify(people)}) rows...`);
  const { error: deletePeopleErr } = await supabase
    .from<DBRelationPerson>('relation_people')
    .delete()
    .eq('meeting', m.id);
  handle('deleting', 'meeting people', people, deletePeopleErr);
  const { error: insertPeopleErr } = await supabase
    .from<DBRelationPerson>('relation_people')
    .insert(people);
  handle('inserting', 'meeting people', people, insertPeopleErr);
  
  return new Meeting({ ...m, people: meeting.people, creator: meeting.creator });
}

export async function deleteMeeting(id: number): Promise<Meeting> {
  const { data, error } = await supabase
    .from<DBMeeting>('meetings')
    .delete()
    .eq('id', id);
  handle('deleting', 'meeting', id, error);
  return data ? Meeting.fromDB(data[0]) : new Meeting({ id });
}

export async function getMeeting(id: number): Promise<Meeting> {
  const { data, error } = await supabase
    .from<DBViewMeeting>('view_meetings')
    .select()
    .eq('id', id);
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
    .contains('subject_ids', query.subjects.map((s) => s.id))
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
  if (query.people.length) select = select.overlaps('people_ids', query.people);
  if (query.search) {
    const config = { config: 'english', type: 'websearch' as const };
    select = select.textSearch('description', query.search, config);
  }
  const { data, error, count } = await select;
  // TODO: Remove this weird edge case workaround for no results.
  // @see {@link https://github.com/supabase/postgrest-js/issues/202}
  if (error instanceof Array) return { results: [], hits: 0 };
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
          id: numid(),
          parentId: meeting.id,
          time: new Timeslot({ ...meeting.time, from: startTime, to: endTime }),
        });
      });
    });
  return { hits, results: meetings.flat() };
}
