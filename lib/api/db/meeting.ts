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
