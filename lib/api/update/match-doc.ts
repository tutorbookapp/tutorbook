import { APIError } from 'lib/api/error';
import { Match } from 'lib/model/match';
import clone from 'lib/utils/clone';
import supabase from 'lib/api/supabase';

export default async function updateMatchDoc(match: Match): Promise<void> {
  const copy: Partial<Match> = clone(match);
  delete copy.people;
  delete copy.id;
  copy.creator = match.creator.id;
  const { error } = await supabase
    .from('matches')
    .update(copy)
    .eq('id', match.id);
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
