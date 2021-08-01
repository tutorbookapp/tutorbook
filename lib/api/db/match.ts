import { addOptionsFilter, list } from 'lib/api/search';
import { APIError } from 'lib/api/error';
import { Match } from 'lib/model/match';
import { MatchesQuery } from 'lib/model/query/matches';
import supabase from 'lib/api/supabase';

export interface DBMatch {
  id: number;
  org: string;
  creator: string;
  subjects: string[];
  message: string;
  tags: 'meeting'[];
  created: Date;
  updated: Date;
}

export interface DBRelationPerson {
  user: string;
  meeting: number | null;
  match: number | null;
  roles: ('tutor' | 'tutee' | 'mentor' | 'mentee' | 'parent')[];
}

export async function createMatch(match: Match): Promise<Match> {
  const { data, error } = await supabase.from<DBMatch>('matches').insert({
    id: match.id,
    org: match.org,
    creator: match.creator.id,
    subjects: match.subjects,
    message: match.message,
    tags: match.tags,
    created: match.created,
    updated: match.updated,
  });
  if (error) {
    const msg = `Error saving match (${match.toString()}) to database`;
    throw new APIError(`${msg}: ${error.message}`, 500);
  }
  const people = match.people.map((p) => ({
    user: p.id,
    roles: p.roles,
    match: data ? data[0].id : match.id,
  }));
  const { error: e } = await supabase
    .from<DBRelationPerson>('relation_people')
    .insert(people);
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

export async function getMatch(id: string): Promise<Match> {
  const { data } = await supabase
    .from<DBMatch>('matches')
    .select()
    .eq('id', id);
  if (!data || !data[0])
    throw new APIError(`Match (${id}) does not exist in database`);
  return Match.parse(data[0]);
}

export async function getMatches(
  query: MatchesQuery
): Promise<{ hits: number; results: Match[] }> {
  let str = query.org ? `org:${query.org}` : '';
  str = addOptionsFilter(str, query.people, 'people.id', 'OR');
  str = addOptionsFilter(str, query.subjects, 'subjects', 'OR');
  return list('matches', query, Match.parse, [str]);
}

export async function updateMatch(match: Match): Promise<void> {
  const { error } = await supabase
    .from<DBMatch>('matches')
    .update({
      id: match.id,
      org: match.org,
      creator: match.creator.id,
      subjects: match.subjects,
      message: match.message,
      tags: match.tags,
      created: match.created,
      updated: match.updated,
    })
    .eq('id', match.id as number);
  if (error) {
    const msg = `Error updating match (${match.toString()}) in database`;
    throw new APIError(`${msg}: ${error.message}`, 500);
  }
  const people = match.people.map((p) => ({
    user: p.id,
    roles: p.roles,
    match: match.id,
  }));
  const { error: e } = await supabase.from('relation_people').update(people);
  if (e) {
    const msg = `Error updating people (${JSON.stringify(people)})`;
    throw new APIError(`${msg} in database: ${e.message}`, 500);
  }
}

export async function deleteMatch(matchId: number): Promise<void> {
  const { error } = await supabase
    .from<DBMatch>('matches')
    .delete()
    .eq('id', matchId);
  if (error) {
    const msg = `Error deleting match (${matchId}) from database`;
    throw new APIError(`${msg}: ${error.message}`, 500);
  }
}
