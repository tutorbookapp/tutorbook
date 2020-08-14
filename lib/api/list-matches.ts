import { NextApiRequest, NextApiResponse } from 'next';
import algoliasearch, { SearchClient, SearchIndex } from 'algoliasearch/lite';
import { SearchResponse } from '@algolia/client-search';
import to from 'await-to-js';

import { Match, MatchJSON, MatchSearchHit, MatchesQuery } from 'lib/model';

import { getFilterString } from './helpers/search';

const algoliaId: string = process.env.ALGOLIA_SEARCH_ID as string;
const algoliaKey: string = process.env.ALGOLIA_SEARCH_KEY as string;

const client: SearchClient = algoliasearch(algoliaId, algoliaKey);
const index: SearchIndex = client.initIndex(
  process.env.NODE_ENV === 'development' ? 'test-matches' : 'default-matches'
);

async function searchMatches(
  query: MatchesQuery
): Promise<{ results: Match[]; hits: number }> {
  const filters: string = getFilterString(query);
  const { page, hitsPerPage, query: text } = query;
  console.log('[DEBUG] Searching matches by:', {
    text,
    page,
    hitsPerPage,
    filters,
  });
  const [err, res] = await to<SearchResponse<MatchSearchHit>>(
    index.search(text, { page, hitsPerPage, filters }) as Promise<
      SearchResponse<MatchSearchHit>
    >
  );
  if (err) throw new Error(`${err.name} while searching: ${err.message}`);
  const { hits, nbHits } = res as SearchResponse<MatchSearchHit>;
  return {
    results: hits.map((hit: MatchSearchHit) => Match.fromSearchHit(hit)),
    hits: nbHits,
  };
}

export interface ListMatchesRes {
  matches: MatchJSON[];
  hits: number;
}

/**
 * Searches and lists the current user's and/or their orgs's and/or their
 * children's appointments.
 *
 * All search parameters are applied and then the results are filtered by the
 * given JWT's authentication access (i.e. to only show their's, their orgs's,
 * and their children's appointments).
 *
 * @param {MatchQueryJSON} query - A query parsed into URL query parameters.
 * @return { matches: MatchJSON[]; hits: number } - The results (visible on the
 * requested page) and the total number of results (for pagination purposes).
 */
export default async function listMatches(
  req: NextApiRequest,
  res: NextApiResponse<ListMatchesRes>
): Promise<void> {
  console.log('[DEBUG] Getting matches search results...');
  const query: MatchesQuery = MatchesQuery.fromURLParams(req.query);
  const { results, hits } = await searchMatches(query);
  console.log(`[DEBUG] Got ${hits} results.`);
  const matches: MatchJSON[] = results.map((match: Match) => match.toJSON());
  res.status(200).json({ matches, hits });
}
