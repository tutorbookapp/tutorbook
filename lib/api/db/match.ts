import { addOptionsFilter, list } from 'lib/api/search';
import { Match } from 'lib/model/match';
import { MatchesQuery } from 'lib/model/query/matches';

export default async function getMatches(
  query: MatchesQuery
): Promise<{ hits: number; results: Match[] }> {
  let str = query.org ? `org:${query.org}` : '';
  str = addOptionsFilter(str, query.people, 'people.id', 'OR');
  str = addOptionsFilter(str, query.subjects, 'subjects', 'OR');
  return list('matches', query, Match.parse, [str]);
}

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

import { APIError } from 'lib/api/error';
import supabase from 'lib/api/supabase';

export default async function deleteMatchDoc(matchId: string): Promise<void> {
  const { error } = await supabase.from('matches').delete().eq('id', matchId);
  if (error) {
    const msg = `Error deleting match (${matchId}) from database`;
    throw new APIError(`${msg}: ${error.message}`, 500);
  }
}

import { APIError } from 'lib/api/error';
import { Match } from 'lib/model/match';
import clone from 'lib/utils/clone';
import supabase from 'lib/api/supabase';

export default async function createMatchDoc(match: Match): Promise<Match> {
  const copy: Partial<Match> = clone(match);
  delete copy.people;
  delete copy.id;
  copy.creator = match.creator.id;
  const { data, error } = await supabase.from<Match>('matches').insert(copy);
  if (error) {
    const msg = `Error saving match (${match.toString()}) to database`;
    throw new APIError(`${msg}: ${error.message}`, 500);
  }
  const people = match.people.map((p) => ({
    user: p.id,
    roles: p.roles,
    match: data ? data[0].id : match.id,
  }));
  const { error: e } = await supabase.from('relation_people').insert(people);
  if (e) {
    const msg = `Error saving people (${JSON.stringify(people)})`;
    throw new APIError(`${msg} in database: ${e.message}`, 500);
  }
  return Match.parse({
    ...(data ? data[0] : match),
    people: match.people,
    creator: match.creator,
  });
}
