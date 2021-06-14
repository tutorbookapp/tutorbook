import { Match } from 'lib/model/match';
import { MatchesQuery } from 'lib/model/query/matches';
import { addOptionsFilter, list } from 'lib/api/search';

export default async function getMatches(
  query: MatchesQuery
): Promise<{ hits: number; results: Match[] }> {
  let str = query.org ? `org:${query.org}` : '';
  str = addOptionsFilter(str, query.people, 'people.id', 'OR');
  str = addOptionsFilter(str, query.subjects, 'subjects', 'OR');
  return list('matches', query, Match.fromSearchHit, [str]);
}
