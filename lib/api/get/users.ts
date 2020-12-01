import { SearchOptions, SearchResponse } from '@algolia/client-search';
import algoliasearch from 'algoliasearch/lite';
import to from 'await-to-js';

import { Option, Timeslot, User, UserSearchHit, UsersQuery } from 'lib/model';
import { APIError } from 'lib/api/error';

const algoliaId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID as string;
const algoliaKey = process.env.ALGOLIA_ADMIN_KEY as string;

const client = algoliasearch(algoliaId, algoliaKey);

/**
 * Adds a given filter set to an existing filter string (concatenating them with
 * ' AND ').
 * @example
 * let filterString = 'visible=1';
 * filterString = addFilter('(langs:"fr" OR langs:"en")');
 * assert(filterString === 'visible=1 AND (langs:"fr" OR langs:"en")');
 */
function addFilter(base: string, filter: string): string {
  const addAND = base.length && !base.endsWith(' AND ') && filter.length;
  return addAND ? `${base} AND ${filter}` : `${base}${filter}`;
}

/**
 * Adds a set of ' AND ' filters to an existing filter string.
 * @example
 * const langs = [{
 *  label: 'English',
 *  value: 'en',
 * }, {
 *  label: 'French',
 *  value: 'fr',
 * }];
 * let filterString = 'visible=1';
 * filterString = addFilters(filterString, langs, 'langs');
 * assert(filterString === 'visible=1 AND (langs:"fr" OR langs:"en")');
 */
function addFilters(
  base: string,
  filters: Option<string>[],
  attr: string,
  concat: 'OR' | 'AND' = 'AND'
): string {
  const addAND = base.length && !base.endsWith(' AND ') && filters.length;
  let filterString = addAND ? `${base} AND ` : base;
  for (let i = 0; i < filters.length; i += 1) {
    filterString += i === 0 ? '(' : ` ${concat} `;
    filterString += `${attr}:"${filters[i].value}"`;
    if (i === filters.length - 1) filterString += ')';
  }
  return filterString;
}

function getFilterString(query: UsersQuery): string {
  let filterString = '';
  filterString = addFilters(filterString, query.orgs, 'orgs', 'OR');
  filterString = addFilters(filterString, query.tags, '_tags');
  return filterString;
}

/**
 * Creates and returns the filter string to search our Algolia index based on
 * `this.props.filters`. Note that due to Algolia restrictions, we **cannot**
 * nest ANDs with ORs (e.g. `(A AND B) OR (B AND C)`). Because of this
 * limitation, we merge results from many queries on the client side (e.g. get
 * results for `A AND B` and merge them with the results for `B AND C`).
 * @example
 * '(tutoring.subjects:"Chemistry H" OR tutoring.subjects:"Chemistry") AND ' +
 * '((availability.from <= 1587304800001 AND availability.to >= 1587322800000))'
 * @see {@link https://www.algolia.com/doc/guides/managing-results/refine-results/filtering/how-to/filter-by-date/?language=javascript}
 * @see {@link https://www.algolia.com/doc/guides/managing-results/refine-results/filtering/in-depth/combining-boolean-operators/#combining-ands-and-ors}
 * @see {@link https://www.algolia.com/doc/guides/managing-results/refine-results/filtering/how-to/filter-arrays/?language=javascript}
 */
function getFilterStrings(query: UsersQuery): string[] {
  let filterString: string = getFilterString(query);
  if (typeof query.visible === 'boolean')
    filterString = addFilter(filterString, `visible=${query.visible ? 1 : 0}`);
  filterString = addFilters(
    filterString,
    query.subjects,
    `${query.aspect}.subjects`
  );
  filterString = addFilters(filterString, query.langs, 'langs');
  filterString = addFilters(filterString, query.checks, 'verifications.checks');
  filterString = addFilters(filterString, query.parents, 'parents');
  if (query.availability.length) filterString += ' AND ';
  const filterStrings: string[] = [];
  query.availability.forEach((timeslot: Timeslot) =>
    filterStrings.push(
      `${filterString}(availability.from <= ${timeslot.from.valueOf()}` +
        ` AND availability.to >= ${timeslot.to.valueOf()})`
    )
  );
  if (!query.availability.length) filterStrings.push(filterString);
  return filterStrings;
}

/**
 * This is our way of showing the most relevant search results first without
 * paying for Algolia's visual editor.
 * @todo Show verified results first.
 * @see {@link https://www.algolia.com/doc/guides/managing-results/rules/merchandising-and-promoting/how-to/how-to-promote-with-optional-filters/}
 */
function getOptionalFilterStrings(query: UsersQuery): string[] {
  return [`featured:${query.aspect}`];
}

/**
 * Fetches users from our Algolia search indices based on a given query.
 * @param query - The query to use while searching.
 * @return Promise that resolves to an object containing:
 * 1. The total number of hits for that query (`hits`).
 * 2. The requested results (`users`) as an array of `User` objects.
 * @todo Refactor all of the logic included in this file into smaller, more
 * reusable and readable functions.
 */
export default async function getUsers(
  query: UsersQuery
): Promise<{ hits: number; users: User[] }> {
  let hits = 0;
  const users: User[] = [];
  let filterStrings: (string | undefined)[] = getFilterStrings(query);
  if (!filterStrings.length) filterStrings = [undefined];
  const index = client.initIndex(`${process.env.APP_ENV as string}-users`);
  const optionalFilters = getOptionalFilterStrings(query);
  const { page, hitsPerPage, query: text } = query;
  await Promise.all(
    filterStrings.map(async (filterString) => {
      const options: SearchOptions | undefined = filterString
        ? { page, hitsPerPage, optionalFilters, filters: filterString }
        : { page, hitsPerPage, optionalFilters };
      const [err, res] = await to<SearchResponse<UserSearchHit>>(
        index.search(text, options) as Promise<SearchResponse<UserSearchHit>>
      );
      if (err)
        throw new APIError(
          `${err.name} filtering users (${options.filters as string}): ${
            err.message
          }`
        );
      (res as SearchResponse<UserSearchHit>).hits.forEach((hit) => {
        if (users.findIndex((u) => u.id === hit.objectID) < 0)
          users.push(User.fromSearchHit(hit));
      });
      hits += (res as SearchResponse<UserSearchHit>).nbHits;
    })
  );
  return { users, hits };
}
