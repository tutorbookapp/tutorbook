import { DBMeeting, DBRelationMeetingPerson, Meeting } from 'lib/model/meeting';
import { APIError } from 'lib/api/error';
import supabase from 'lib/api/supabase';

export async function createMeeting(meeting: Meeting): Promise<Meeting> {
  const { data, error } = await supabase
    .from<DBMeeting>('meetings')
    .insert(meeting.toDB());
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
  return Meeting.fromDB(data[0]);
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
    .update(meeting.toDB())
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
