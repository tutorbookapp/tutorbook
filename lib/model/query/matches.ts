import url from 'url';

import { z } from 'zod';

import { Option, Query, number } from 'lib/model/query/base';

export const MatchesQuery = Query.extend({
  org: z.string().optional(),
  people: z.array(Option).default([]),
  subjects: z.array(Option).default([]),
  hitsPerPage: number.default(10),
});
export type MatchesQuery = z.infer<typeof MatchesQuery>;

export function encode(query: MatchesQuery): Record<string, string> {
  function json<T>(p: T[]): string {
    return encodeURIComponent(JSON.stringify(p));
  }

  const params: Record<string, string> = {};
  if (query.search) params.search = encodeURIComponent(query.search);
  if (query.hitsPerPage !== 10) params.hitsPerPage = `${query.hitsPerPage}`;
  if (query.page !== 0) params.page = `${query.page}`;
  if (query.org) params.org = encodeURIComponent(query.org);
  if (query.people.length) params.people = json(query.people);
  if (query.subjects.length) params.subjects = json(query.subjects);
  return params;
}

export function decode(params: Record<string, string>): MatchesQuery {
  function json<T>(p: string): T[] {
    return JSON.parse(decodeURIComponent(p)) as T[];
  }

  const query = MatchesQuery.parse({});
  if (params.search) query.search = decodeURIComponent(params.search);
  if (params.hitsPerPage) query.hitsPerPage = Number(params.hitsPerPage);
  if (params.page) query.page = Number(params.page);
  if (params.org) query.org = decodeURIComponent(params.org);
  if (params.people) query.people = json(params.people);
  if (params.subjects) query.subjects = json(params.subjects);
  return query;
}

export function endpoint(query: MatchesQuery, pathname = '/api/matches'): string {
  return url.format({ pathname, query: encode(query) });
}
