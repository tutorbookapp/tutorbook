import url from 'url';

import { z } from 'zod';

import { MatchesQuery } from 'lib/model/query/matches';
import { MeetingHitTag } from 'lib/model/meeting';
import { date } from 'lib/model/timeslot';
import { number } from 'lib/model/query/base';

export const MeetingsQuery = MatchesQuery.extend({
  tags: z.array(MeetingHitTag).default([]),
  from: date.default(
    () =>
      new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        new Date().getDate() - new Date().getDay()
      )
  ),
  to: date.default(
    () =>
      new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        new Date().getDate() - new Date().getDay() + 7
      )
  ),
  hitsPerPage: number.default(1000),
});
export type MeetingsQuery = z.infer<typeof MeetingsQuery>;

export function encode(query: MeetingsQuery): Record<string, string> {
  function json<T>(p: T[]): string {
    return encodeURIComponent(JSON.stringify(p));
  }

  const params: Record<string, string> = {};
  if (query.search) params.search = encodeURIComponent(query.search);
  if (query.hitsPerPage !== 1000) params.hitsPerPage = `${query.hitsPerPage}`;
  if (query.page !== 0) params.page = `${query.page}`;
  if (query.org) params.org = encodeURIComponent(query.org);
  if (query.people.length) params.people = json(query.people);
  if (query.subjects.length) params.subjects = json(query.subjects);
  if (query.tags.length) params.tags = json(query.tags);
  params.from = query.from.toJSON();
  params.to = query.to.toJSON();
  return params;
}

export function decode(params: Record<string, string>): MeetingsQuery {
  function json<T>(p: string): T[] {
    return JSON.parse(decodeURIComponent(p)) as T[];
  }

  const query = MeetingsQuery.parse({});
  if (params.search) query.search = decodeURIComponent(params.search);
  if (params.hitsPerPage) query.hitsPerPage = Number(params.hitsPerPage);
  if (params.page) query.page = Number(params.page);
  if (params.org) query.org = decodeURIComponent(params.org);
  if (params.people) query.people = json(params.people);
  if (params.subjects) query.subjects = json(params.subjects);
  if (params.tags) query.tags = json(params.tags);
  if (params.from && !Number.isNaN(new Date(params.from).valueOf()))
    query.from = new Date(params.from);
  if (params.to && !Number.isNaN(new Date(params.to).valueOf()))
    query.to = new Date(params.to);
  return query;
}

export function endpoint(
  query: MeetingsQuery,
  pathname = '/api/meetings'
): string {
  return url.format({ pathname, query: encode(query) });
}
