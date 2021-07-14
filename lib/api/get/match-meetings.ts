import { Meeting } from 'lib/model/meeting';
import supabase from 'lib/api/supabase';

export default async function getMatchMeetings(
  matchId: string
): Promise<Meeting[]> {
  const { data } = await supabase.from<Meeting>('meetings').select().eq('match', matchId);
  return (data || []).map((d) => Meeting.parse(d));
}
