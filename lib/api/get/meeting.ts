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
