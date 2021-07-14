import url from 'url';

import { z } from 'zod';

import { Option, Query } from 'lib/model/query/base';
import { Aspect } from 'lib/model/aspect';
import { Availability } from 'lib/model/availability';
import { UserHitTag } from 'lib/model/user';

/**
 * All the supported filters for the search view.
 * @extends {QueryInterface}
 * @property parents - Parents that the user has to have.
 * @property orgs - Orgs that the user has to belong to.
 * @property tags - Algolia search index tags the user must have.
 * @property aspect - Whether to filter by mentoring or tutoring subjects.
 * @property langs - The languages that the user can speak.
 * @property subjects - Subjects that the user can tutor or mentor.
 * @property availability - When the user is available.
 * @property [available] - When true, we only show results that are available.
 * We have to use this in order to only show results that are available in the
 * search view (for students) but to show all results in the users dashboard.
 * @property [visible] - Regular users can only ever see users where this is
 * `true`. Organization admins, however, can see all their users (regardless of
 * their visibility) which is why this property exists.
 */
export const UsersQuery = Query.extend({
  parents: z.array(z.string()).default([]),
  orgs: z.array(z.string()).default([]),
  tags: z.array(UserHitTag).default([]),
  aspect: Aspect.default('tutoring'),
  langs: z.array(Option).default([]),
  subjects: z.array(Option).default([]),
  availability: Availability.default(Availability.parse([])),
  available: z.boolean().optional(),
  visible: z.boolean().optional(),
});
export type UsersQuery = z.infer<typeof UsersQuery>;

export function encode(query: UsersQuery): Record<string, string> {
  function json<T>(p: T[]): string {
    return encodeURIComponent(JSON.stringify(p));
  }

  const params: Record<string, string> = {};
  if (query.search) params.search = encodeURIComponent(query.search);
  if (query.hitsPerPage !== 20) params.hitsPerPage = `${query.hitsPerPage}`;
  if (query.page !== 0) params.page = `${query.page}`;
  if (query.parents.length) params.parents = json(query.parents);
  if (query.orgs.length) params.orgs = json(query.orgs);
  if (query.tags.length) params.tags = json(query.tags);
  if (query.aspect !== 'tutoring') params.aspect = query.aspect;
  if (query.langs.length) params.langs = json(query.langs);
  if (query.subjects.length) params.subjects = json(query.subjects);
  if (query.availability.length) params.availability = json(query.availability);
  if (query.available === true) params.available = 'true';
  if (typeof query.visible === 'boolean') params.visible = `${query.visible}`;
  return params;
}

export function decode(params: Record<string, string>): UsersQuery {
  function json<T>(p: string): T[] {
    return JSON.parse(decodeURIComponent(p)) as T[];
  }

  const query = UsersQuery.parse({});
  if (params.search) query.search = encodeURIComponent(params.search);
  if (params.hitsPerPage) query.hitsPerPage = Number(params.hitsPerPage);
  if (params.page) query.page = Number(params.page);
  if (params.parents.length) query.parents = json(params.parents);
  if (params.orgs.length) query.orgs = json(params.orgs);
  if (params.tags.length) query.tags = json(params.tags);
  if (params.aspect !== 'tutoring') query.aspect = Aspect.parse(params.aspect);
  if (params.langs.length) query.langs = json(params.langs);
  if (params.subjects.length) query.subjects = json(params.subjects);
  if (params.availability.length) query.availability = json(params.availability);
  if (params.available === 'true') query.available = true;
  if (params.visible) query.visible = params.visible === 'true';
  return query;
}

export function endpoint(query: UsersQuery, pathname = '/api/users'): string {
  return url.format({ pathname, query: encode(query) });
}
