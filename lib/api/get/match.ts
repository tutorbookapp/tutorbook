import { APIError } from 'lib/api/error';
import { Match } from 'lib/model/match';
import supabase from 'lib/api/supabase';

interface DBMatch {
  id: number;
  org: string;
  creator: string;
  subjects: string[];
  message: string;
  tags: 'meeting'[];
  created: Date;
  updated: Date;
}

interface DBRelationPerson {
  user: string;
  meeting: number | null;
  match: number | null;
  roles: ('tutor' | 'tutee' | 'mentor' | 'mentee' | 'parent')[];
}

export default async function getMatch(id: string): Promise<Match> {
  const { data } = await supabase.from<Match>('matches').select().eq('id', id);
  if (!data || !data[0])
    throw new APIError(`Match (${id}) does not exist in database`);
  return Match.parse(data[0]);
}
