import {
  DBMatch,
  DBRelationMatchPerson,
  DBViewMatch,
  Match,
} from 'lib/model/match';
import { APIError } from 'lib/model/error';
import { MatchesQuery } from 'lib/model/query/matches';
import handle from 'lib/api/db/error';
import logger from 'lib/api/logger';
import supabase from 'lib/api/supabase';

export async function createMatch(match: Match): Promise<Match> {
  logger.verbose(`Inserting match (${match.toString()}) row...`);
  const { data, error } = await supabase
    .from<DBMatch>('matches')
    .insert({ ...match.toDB(), id: undefined });
  handle('creating', 'match', match, error);
  const m = data ? Match.fromDB(data[0]) : match;
  const people: DBRelationMatchPerson[] = match.people.map((p) => ({
    user: p.id,
    roles: p.roles,
    match: m.id,
  }));
  logger.verbose(`Inserting people (${JSON.stringify(people)}) rows...`);
  const { error: err } = await supabase
    .from<DBRelationMatchPerson>('relation_match_people')
    .insert(people);
  handle('creating', 'match people', people, err);
  return new Match({ ...m, people: match.people });
}

export async function updateMatch(match: Match): Promise<Match> {
  logger.verbose(`Updating match (${match.toString()}) row...`);
  const { data, error } = await supabase
    .from<DBMatch>('matches')
    .update({ ...match.toDB(), id: undefined })
    .eq('id', match.id);
  handle('updating', 'match', match, error);
  const m = data ? Match.fromDB(data[0]) : match;
  const people: DBRelationMatchPerson[] = match.people.map((p) => ({
    user: p.id,
    roles: p.roles,
    match: m.id,
  }));
  logger.verbose(`Upserting people (${JSON.stringify(people)}) rows...`);
  const { error: err } = await supabase
    .from<DBRelationMatchPerson>('relation_match_people')
    .upsert(people, { onConflict: 'user,match,roles' });
  handle('updating', 'match people', people, err);
  return new Match({ ...m, people: match.people });
}

export async function deleteMatch(id: number): Promise<Match> {
  const { data, error } = await supabase
    .from<DBMatch>('matches')
    .delete()
    .eq('id', id);
  handle('deleting', 'match', id, error);
  return data ? Match.fromDB(data[0]) : new Match({ id });
}

export async function getMatch(id: number): Promise<Match> {
  const { data, error } = await supabase
    .from<DBViewMatch>('view_matches')
    .select()
    .eq('id', id);
  handle('getting', 'match', id, error);
  if (!data?.length) throw new APIError(`Match (${id}) does not exist`, 404);
  return Match.fromDB(data[0]);
}

export async function getMatches(
  query: MatchesQuery
): Promise<{ hits: number; results: Match[] }> {
  let select = supabase
    .from<DBViewMatch>('view_matches')
    .select('*', { count: 'exact' })
    .contains('subjects', query.subjects)
    .order('id', { ascending: false })
    .range(
      query.hitsPerPage * query.page,
      query.hitsPerPage * (query.page + 1) - 1
    );
  if (query.org) select = select.eq('org', query.org);
  if (query.people.length) {
    const peopleIds = query.people.map((p) => p.value);
    select = select.overlaps('people_ids', peopleIds);
  }
  if (query.search) {
    const config = { config: 'english', type: 'websearch' as 'websearch' };
    select = select.textSearch('description', query.search, config);
  }
  const { data, error, count } = await select;
  // TODO: Remove this weird edge case workaround for no results.
  // @see {@link https://github.com/supabase/postgrest-js/issues/202}
  if (error instanceof Array) return { results: [], hits: 0 };
  handle('getting', 'matches', query, error);
  const results = (data || []).map((m) => Match.fromDB(m));
  return { results, hits: count || results.length };
}
