import { NextApiRequest, NextApiResponse } from 'next';
import algoliasearch, { SearchClient, SearchIndex } from 'algoliasearch/lite';
import { SearchResponse } from '@algolia/client-search';
import { Appt, ApptJSON, ApptSearchHit, ApptsQuery } from 'lib/model';

import to from 'await-to-js';

import { getFilterString } from './helpers/search';

const algoliaId: string = process.env.ALGOLIA_SEARCH_ID as string;
const algoliaKey: string = process.env.ALGOLIA_SEARCH_KEY as string;

const client: SearchClient = algoliasearch(algoliaId, algoliaKey);
const index: SearchIndex = client.initIndex(
  process.env.NODE_ENV === 'development' ? 'test-appts' : 'default-appts'
);

async function searchAppts(
  query: ApptsQuery
): Promise<{ results: Appt[]; hits: number }> {
  const filters: string = getFilterString(query);
  const { page, hitsPerPage, query: text } = query;
  console.log('[DEBUG] Searching appts by:', {
    text,
    page,
    hitsPerPage,
    filters,
  });
  const [err, res] = await to<SearchResponse<ApptSearchHit>>(
    index.search(text, { page, hitsPerPage, filters }) as Promise<
      SearchResponse<ApptSearchHit>
    >
  );
  if (err) throw new Error(`${err.name} while searching: ${err.message}`);
  const { hits, nbHits } = res as SearchResponse<ApptSearchHit>;
  return {
    results: hits.map((hit: ApptSearchHit) => Appt.fromSearchHit(hit)),
    hits: nbHits,
  };
}

export interface ListApptsRes {
  appts: ApptJSON[];
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
 * @param {ApptQueryJSON} query - A query parsed into URL query parameters.
 * @return { appts: ApptJSON[]; hits: number } - The results (visible on the
 * requested page) and the total number of results (for pagination purposes).
 */
export default async function listAppts(
  req: NextApiRequest,
  res: NextApiResponse<ListApptsRes>
): Promise<void> {
  console.log('[DEBUG] Getting appts search results...');
  const query: ApptsQuery = ApptsQuery.fromURLParams(req.query);
  const { results, hits } = await searchAppts(query);
  console.log(`[DEBUG] Got ${hits} results.`);
  const appts: ApptJSON[] = results.map((appt: Appt) => appt.toJSON());
  res.status(200).json({ appts, hits });
}
