import {
  DBMatch,
  DBRelationMatchPerson,
  DBViewMatch,
  Match,
} from 'lib/model/match';
import { APIError } from 'lib/api/error';
import { MatchesQuery } from 'lib/model/query/matches';
import supabase from 'lib/api/supabase';

export async function createMatch(match: Match): Promise<Match> {
  const { data, error } = await supabase
    .from<DBMatch>('matches')
    .insert({ ...match.toDB(), id: undefined });
  if (error) {
    const msg = `Error saving match (${match.toString()}) to database`;
    throw new APIError(`${msg}: ${error.message}`, 500);
  }
  const people: DBRelationMatchPerson[] = match.people.map((p) => ({
    user: p.id,
    roles: p.roles,
    match: data ? data[0].id : Number(match.id),
  }));
  const { error: e } = await supabase
    .from<DBRelationMatchPerson>('relation_match_people')
    .insert(people);
  if (e) {
    const msg = `Error saving people (${JSON.stringify(people)})`;
    throw new APIError(`${msg} in database: ${e.message}`, 500);
  }
  return data ? Match.fromDB(data[0]) : match;
}

export async function getMatch(id: string): Promise<Match> {
  const { data } = await supabase
    .from<DBViewMatch>('view_matches')
    .select()
    .eq('id', id);
  if (!data || !data[0])
    throw new APIError(`Match (${id}) does not exist in database`);
  return Match.fromDB(data[0]);
}

export async function getMatches(
  query: MatchesQuery
): Promise<{ hits: number; results: Match[] }> {
  let select = supabase
    .from<DBViewMatch>('view_matches')
    .select()
    .contains('subjects', query.subjects);
  if (query.org) select = select.eq('org', query.org);
  if (query.people.length) {
    const peopleIds = query.people.map((p) => p.value);
    select = select.overlaps('people_ids', peopleIds);
  }
  const { data, count } = await select;
  const results = (data || []).map((m) => Match.fromDB(m));
  return { results, hits: count || results.length };
}

export async function updateMatch(match: Match): Promise<void> {
  const { error } = await supabase
    .from<DBMatch>('matches')
    .update({ ...match.toDB(), id: undefined })
    .eq('id', Number(match.id));
  if (error) {
    const msg = `Error updating match (${match.toString()}) in database`;
    throw new APIError(`${msg}: ${error.message}`, 500);
  }
  await Promise.all(
    match.people.map(async (p) => {
      const { error: e } = await supabase
        .from<DBRelationMatchPerson>('relation_match_people')
        .update({
          user: p.id,
          roles: p.roles,
          match: Number(match.id),
        })
        .eq('match', Number(match.id))
        .eq('user', p.id);
      if (e) {
        const msg = `Error updating person (${JSON.stringify(p)})`;
        throw new APIError(`${msg} in database: ${e.message}`, 500);
      }
    })
  );
}

export async function deleteMatch(matchId: string): Promise<void> {
  const { error } = await supabase
    .from<DBMatch>('matches')
    .delete()
    .eq('id', Number(matchId));
  if (error) {
    const msg = `Error deleting match (${matchId}) from database`;
    throw new APIError(`${msg}: ${error.message}`, 500);
  }
}
