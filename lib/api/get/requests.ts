import { SearchResponse } from '@algolia/client-search';
import algoliasearch from 'algoliasearch/lite';
import to from 'await-to-js';

import { Request, RequestSearchHit, RequestsQuery, Option } from 'lib/model';
import { APIError } from 'lib/api/error';

const algoliaId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID as string;
const algoliaKey = process.env.ALGOLIA_ADMIN_KEY as string;

const client = algoliasearch(algoliaId, algoliaKey);

function addFilters(
  base: string,
  filters: Option<string>[],
  attr: string
): string {
  const addAND = base.length && !base.endsWith(' AND ') && filters.length;
  let filterString = addAND ? `${base} AND ` : base;
  for (let i = 0; i < filters.length; i += 1) {
    filterString += i === 0 ? '(' : ' OR ';
    filterString += `${attr}:"${filters[i].value}"`;
    if (i === filters.length - 1) filterString += ')';
  }
  return filterString;
}

function getFilterString(query: RequestsQuery): string {
  let filterString = '';
  filterString = addFilters(filterString, query.orgs, 'orgs');
  filterString = addFilters(filterString, query.tags, '_tags');
  return filterString;
}

// TODO: Reduce code duplication between this file and the `getUsers` and the
// `getRequests` Algolia data fetching file.
export default async function searchRequests(
  query: RequestsQuery
): Promise<{ requests: Request[]; hits: number }> {
  const index = client.initIndex(`${process.env.APP_ENV as string}-requests`);
  const filters = getFilterString(query);
  const { page, hitsPerPage, query: text } = query;
  const [err, res] = await to<SearchResponse<RequestSearchHit>>(
    index.search(text, { page, hitsPerPage, filters }) as Promise<
      SearchResponse<RequestSearchHit>
    >
  );
  if (err)
    throw new APIError(
      `${err.name} filtering requests (${filters}): ${err.message}`
    );
  const { hits, nbHits } = res as SearchResponse<RequestSearchHit>;
  return {
    requests: hits.map((hit: RequestSearchHit) => Request.fromSearchHit(hit)),
    hits: nbHits,
  };
}
