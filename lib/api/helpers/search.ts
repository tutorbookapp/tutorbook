import { Option, Query } from 'lib/model';

/**
 * Adds a given filter set to an existing filter string (concatenating them with
 * ' AND ').
 * @example
 * let filterString = 'visible=1';
 * filterString = addFilter('(langs:"fr" OR langs:"en")');
 * assert(filterString === 'visible=1 AND (langs:"fr" OR langs:"en")');
 */
export function addFilter(base: string, filter: string): string {
  const addAND = base.length && !base.endsWith(' AND ') && filter.length;
  return addAND ? `${base} AND ${filter}` : `${base}${filter}`;
}

/**
 * Adds a set of ' OR ' filters to an existing filter string.
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
export function addFilters(
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

export function getFilterString(query: Query): string {
  let filterString = '';
  filterString = addFilters(filterString, query.orgs, 'orgs');
  filterString = addFilters(filterString, query.tags, '_tags');
  return filterString;
}
