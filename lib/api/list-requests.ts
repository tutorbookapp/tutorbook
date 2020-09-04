import { NextApiRequest, NextApiResponse } from 'next';
import algoliasearch, { SearchClient, SearchIndex } from 'algoliasearch/lite';
import { SearchResponse } from '@algolia/client-search';
import to from 'await-to-js';

import {
  Request,
  RequestJSON,
  RequestSearchHit,
  RequestsQuery,
} from 'lib/model';

import { getFilterString } from './helpers/search';

const algoliaId: string = process.env.ALGOLIA_APP_ID as string;
const algoliaKey: string = process.env.ALGOLIA_SEARCH_KEY as string;

const client: SearchClient = algoliasearch(algoliaId, algoliaKey);
const index: SearchIndex = client.initIndex(
  process.env.NODE_ENV === 'development' ? 'test-requests' : 'default-requests'
);

async function searchRequests(
  query: RequestsQuery
): Promise<{ results: Request[]; hits: number }> {
  const filters: string = getFilterString(query);
  const { page, hitsPerPage, query: text } = query;
  console.log('[DEBUG] Searching requests by:', {
    text,
    page,
    hitsPerPage,
    filters,
  });
  const [err, res] = await to<SearchResponse<RequestSearchHit>>(
    index.search(text, { page, hitsPerPage, filters }) as Promise<
      SearchResponse<RequestSearchHit>
    >
  );
  if (err) throw new Error(`${err.name} while searching: ${err.message}`);
  const { hits, nbHits } = res as SearchResponse<RequestSearchHit>;
  return {
    results: hits.map((hit: RequestSearchHit) => Request.fromSearchHit(hit)),
    hits: nbHits,
  };
}

export interface ListRequestsRes {
  requests: RequestJSON[];
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
 * @todo Ensure that the user is only receiving requests that they are
 * authenticated to view (i.e. requests they own, their org owns or their child
 * owns).
 * @param {RequestQueryJSON} query - A query parsed into URL query parameters.
 * @return { requests: RequestJSON[]; hits: number } - The results (visible on the
 * requested page) and the total number of results (for pagination purposes).
 */
export default async function listRequests(
  req: NextApiRequest,
  res: NextApiResponse<ListRequestsRes>
): Promise<void> {
  console.log('[DEBUG] Getting requests search results...');
  const query: RequestsQuery = RequestsQuery.fromURLParams(req.query);
  const { results, hits } = await searchRequests(query);
  console.log(`[DEBUG] Got ${hits} results.`);
  const requests: RequestJSON[] = results.map((request: Request) =>
    request.toJSON()
  );
  res.status(200).json({ requests, hits });
}
