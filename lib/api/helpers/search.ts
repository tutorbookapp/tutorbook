import { Option, Query } from 'lib/model';

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
