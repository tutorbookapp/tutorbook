import { APIError } from 'lib/api/error';
import { DBRelationPerson } from 'lib/api/db/match';
import { DBTimeslot } from 'lib/api/db/user';
import { Meeting } from 'lib/model/meeting';
import supabase from 'lib/api/supabase';

export interface DBMeeting {
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

export async function createMeeting(meeting: Meeting): Promise<Meeting> {
  const { data, error } = await supabase.from<DBMeeting>('meetings').insert({
    id: Number(meeting.id),
    org: meeting.match.org,
    creator: meeting.creator.id,
    subjects: meeting.match.subjects,
    status: meeting.status,
    match: Number(meeting.match.id),
    venue: meeting.venue.url,
    time: {
      id: meeting.time.id,
      from: meeting.time.from,
      to: meeting.time.to,
      exdates: meeting.time.exdates || null,
      recur: meeting.time.recur || null,
      last: meeting.time.last || null,
    },
    description: meeting.description,
    tags: meeting.tags,
    created: meeting.created,
    updated: meeting.updated,
  });
  if (error) {
    const msg = `Error saving meeting (${meeting.toString()}) to database`;
    throw new APIError(`${msg}: ${error.message}`, 500);
  }
  const people: DBRelationPerson[] = meeting.match.people.map((p) => ({
    user: p.id,
    roles: p.roles,
    meeting: data ? data[0].id : Number(meeting.id),
    match: null,
  }));
  const { error: e } = await supabase
    .from<DBRelationPerson>('relation_people')
    .insert(people);
  if (e) {
    const msg = `Error saving people (${JSON.stringify(people)}) to database`;
    throw new APIError(`${msg}: ${e.message}`, 500);
  }
  return new Meeting({
    ...(data ? data[0] : meeting),
    creator: meeting.creator,
    match: meeting.match,
    venue: meeting.venue,
    time: meeting.time,
    id: data ? data[0].id.toString() : meeting.id,
  });
}

export async function getMeeting(id: string): Promise<Meeting> {
  const { data } = await supabase
    .from<DBMeeting>('meetings')
    .select()
    .eq('id', Number(id));
  if (!data || !data[0])
    throw new APIError(`Meeting (${id}) does not exist in database`);
  return new Meeting(data[0]);
}

export async function updateMeeting(meeting: Meeting): Promise<void> {
  const { error } = await supabase
    .from<DBMeeting>('meetings')
    .update({
      id: Number(meeting.id),
      org: meeting.match.org,
      creator: meeting.creator.id,
      subjects: meeting.match.subjects,
      status: meeting.status,
      match: Number(meeting.match.id),
      venue: meeting.venue.url,
      time: {
        id: meeting.time.id,
        from: meeting.time.from,
        to: meeting.time.to,
        exdates: meeting.time.exdates || null,
        recur: meeting.time.recur || null,
        last: meeting.time.last || null,
      },
      description: meeting.description,
      tags: meeting.tags,
      created: meeting.created,
      updated: meeting.updated,
    })
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
