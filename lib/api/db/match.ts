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
