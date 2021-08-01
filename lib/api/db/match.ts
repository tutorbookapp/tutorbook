import { APIError } from 'lib/api/error';
import { Match } from 'lib/model/match';
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
    id: Number(match.id),
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
  const people: DBRelationPerson[] = match.people.map((p) => ({
    user: p.id,
    roles: p.roles,
    match: data ? data[0].id : Number(match.id),
    meeting: null,
  }));
  const { error: e } = await supabase
    .from<DBRelationPerson>('relation_people')
    .insert(people);
  if (e) {
    const msg = `Error saving people (${JSON.stringify(people)})`;
    throw new APIError(`${msg} in database: ${e.message}`, 500);
  }
  return new Match({
    ...(data ? data[0] : match),
    people: match.people,
    creator: match.creator,
    id: data ? data[0].id.toString() : match.id,
  });
}

export async function getMatch(id: string): Promise<Match> {
  const { data } = await supabase
    .from<DBMatch>('matches')
    .select()
    .eq('id', id);
  if (!data || !data[0])
    throw new APIError(`Match (${id}) does not exist in database`);
  return new Match(data[0]);
}

export async function updateMatch(match: Match): Promise<void> {
  const { error } = await supabase
    .from<DBMatch>('matches')
    .update({
      id: Number(match.id),
      org: match.org,
      creator: match.creator.id,
      subjects: match.subjects,
      message: match.message,
      tags: match.tags,
      created: match.created,
      updated: match.updated,
    })
    .eq('id', Number(match.id));
  if (error) {
    const msg = `Error updating match (${match.toString()}) in database`;
    throw new APIError(`${msg}: ${error.message}`, 500);
  }
  const people: DBRelationPerson[] = match.people.map((p) => ({
    user: p.id,
    roles: p.roles,
    match: Number(match.id),
    meeting: null,
  }));
  const { error: e } = await supabase
    .from<DBRelationPerson>('relation_people')
    .update(people);
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
