import { SearchResponse } from '@algolia/client-search';
import algoliasearch from 'algoliasearch/lite';
import to from 'await-to-js';

import { Match, MatchSearchHit, MatchesQuery, Option } from 'lib/model';
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

function getFilterString(query: MatchesQuery): string {
  let filterString = query.org ? `org:${query.org}` : '';
  filterString = addFilters(filterString, query.orgs, 'orgs');
  filterString = addFilters(filterString, query.people, 'people.id');
  filterString = addFilters(filterString, query.tags, '_tags');
  return filterString;
}

// TODO: Reduce code duplication between this file and the `getUsers` Algolia
// data fetching file.
export default async function searchMatches(
  query: MatchesQuery
): Promise<{ matches: Match[]; hits: number }> {
  const index = client.initIndex(`${process.env.APP_ENV as string}-matches`);
  const filters = getFilterString(query);
  const { page, hitsPerPage, query: text } = query;
  const [err, res] = await to<SearchResponse<MatchSearchHit>>(
    index.search(text, { page, hitsPerPage, filters }) as Promise<
      SearchResponse<MatchSearchHit>
    >
  );
  if (err)
    throw new APIError(
      `${err.name} filtering matches (${filters}): ${err.message}`
    );
  const { hits, nbHits } = res as SearchResponse<MatchSearchHit>;
  return {
    matches: hits.map((hit: MatchSearchHit) => Match.fromSearchHit(hit)),
    hits: nbHits,
  };
}
