/* eslint-disable max-classes-per-file */

import url from 'url';
import to from 'await-to-js';
import axios, { AxiosResponse, AxiosError } from 'axios';

import { ListUsersRes } from 'lib/api/list-users';

import { ApiError } from './errors';
import { User, UserJSON, Check, Tag, Aspect } from './user';
import { Availability, AvailabilityJSON } from './availability';

import construct from './construct';

/**
 * The base object just supports pagination, text-based search, and tag filters.
 * @abstract
 * @property query - The current string search query.
 * @property orgs - The organizations that the resource belongs to.
 * @property tags - Algolia search `__tags` (e.g. `NOT_YET_VETTED`).
 * @property hitsPerPage - The number of hits to display per page (pagination).
 * @property page - The current page number (for pagination purposes).
 */
export interface QueryInterface {
  query: string;
  orgs: Option<string>[];
  tags: Option<Tag>[];
  hitsPerPage: number;
  page: number;
}
export type QueryJSON = QueryInterface;
export type QueryURL = { [key in keyof QueryInterface]?: string };

export type ApptsQueryInterface = QueryInterface;
export type ApptsQueryJSON = QueryJSON;
export type ApptsQueryURL = QueryURL;

/**
 * All the supported filters for the search view.
 * @extends {QueryInterface}
 * @property aspect - The currently filtered aspect (i.e. tutors or mentors).
 * @property langs - The languages that the user can speak; OR category.
 * @property subjects - The subjects the user can tutor/mentor for; OR category.
 * @property availability - When the user is available; OR category.
 * @property checks - The checks the user has passed; OR category.
 * @property parents - The parents that the user is a child to; OR category.
 * @property [visible] - Regular users can only ever see users where this is
 * `true`. Organization admins, however, can see all their users (regardless of
 * their visibility) which is why this property exists.
 */
export interface UsersQueryInterface extends QueryInterface {
  aspect: Aspect;
  langs: Option<string>[];
  subjects: Option<string>[];
  availability: Availability;
  checks: Option<Check>[];
  parents: Option<string>[];
  visible?: boolean;
}
export type UsersQueryJSON = Omit<UsersQueryInterface, 'availability'> & {
  availability: AvailabilityJSON;
};
export type UsersQueryURL = { [key in keyof UsersQueryInterface]?: string };

export interface Option<T> {
  label: string;
  value: T;
}

export abstract class Query implements QueryInterface {
  public query = '';

  public orgs: Option<string>[] = [];

  public tags: Option<Tag>[] = [];

  // The number of hits per page (for pagination purposes).
  // @see {@link https://www.algolia.com/doc/guides/building-search-ui/going-further/backend-search/how-to/pagination/}
  // @see {@link https://www.algolia.com/doc/api-reference/api-parameters/hitsPerPage/}
  public hitsPerPage = 20;

  // The current page number. For some CS-related reason, Algolia starts
  // counting page numbers from 0 instead of 1.
  // @see {@link https://www.algolia.com/doc/api-reference/api-parameters/page/}
  public page = 0;

  public constructor(query: Partial<QueryInterface> = {}) {
    construct<QueryInterface>(this, query);
  }

  public abstract get endpoint(): string;

  protected getURL(pathname: string): string {
    function encode(p?: Option<any>[]): string {
      return encodeURIComponent(JSON.stringify(p));
    }

    return url.format({
      pathname,
      query: {
        query: encodeURIComponent(this.query),
        orgs: encode(this.orgs),
        tags: encode(this.tags),
        page: this.page,
        hitsPerPage: this.hitsPerPage,
      },
    });
  }

  public static fromURLParams(params: QueryURL): QueryInterface {
    function decode<T = string>(p?: string): Option<T>[] {
      return p ? (JSON.parse(decodeURIComponent(p)) as Option<T>[]) : [];
    }

    return {
      query: decodeURIComponent(params.query || ''),
      orgs: decode<Check>(params.orgs),
      tags: decode(params.tags),
      page: Number(decodeURIComponent(params.page || '0')),
      hitsPerPage: Number(decodeURIComponent(params.hitsPerPage || '20')),
    };
  }

  public static fromJSON(json: QueryJSON): QueryInterface {
    return json;
  }

  public getPaginationString(hits: number): string {
    const begin: number = this.hitsPerPage * this.page + 1;
    const end: number = this.hitsPerPage * (this.page + 1);
    return `${begin}-${end > hits ? hits : end} of ${hits}`;
  }
}

export class ApptsQuery extends Query implements ApptsQueryInterface {
  public get endpoint(): string {
    return this.getURL('/api/appts');
  }

  public static fromURLParams(params: ApptsQueryURL): ApptsQuery {
    return new ApptsQuery(super.fromURLParams(params));
  }

  public static fromJSON(json: ApptsQueryJSON): ApptsQuery {
    return new ApptsQuery(super.fromJSON(json));
  }
}

export class UsersQuery extends Query implements UsersQueryInterface {
  public aspect: Aspect = 'mentoring';

  public subjects: Option<string>[] = [];

  public availability: Availability = new Availability();

  public langs: Option<string>[] = [];

  public checks: Option<Check>[] = [];

  public parents: Option<string>[] = [];

  public visible?: boolean;

  public constructor(query: Partial<UsersQueryInterface> = {}) {
    super(query);
    construct<QueryInterface>(this, query);
  }

  public get url(): string {
    return this.getURL('/search');
  }

  public get endpoint(): string {
    return this.getURL('/api/users');
  }

  protected getURL(pathname: string): string {
    function encode(p?: Option<any>[]): string {
      return encodeURIComponent(JSON.stringify(p));
    }

    return url.format({
      pathname,
      query: {
        query: encodeURIComponent(this.query),
        orgs: encode(this.orgs),
        tags: encode(this.tags),
        page: this.page,
        hitsPerPage: this.hitsPerPage,
        aspect: encodeURIComponent(this.aspect),
        langs: encode(this.langs),
        subjects: encode(this.subjects),
        availability: this.availability.toURLParam(),
        checks: encode(this.checks),
        parents: encode(this.parents),
        visible: this.visible,
      },
    });
  }

  public static fromURLParams(params: UsersQueryURL): UsersQuery {
    function decode<T = string>(p?: string): Option<T>[] {
      return p ? (JSON.parse(decodeURIComponent(p)) as Option<T>[]) : [];
    }

    return new UsersQuery({
      ...super.fromURLParams(params),
      parents: decode<Check>(params.parents),
      checks: decode(params.checks),
      langs: decode(params.langs),
      subjects: decode(params.subjects),
      visible: params.visible ? params.visible === 'true' : undefined,
      availability: params.availability
        ? Availability.fromURLParam(params.availability)
        : new Availability(),
      aspect: decodeURIComponent(params.aspect || 'mentoring') as Aspect,
    });
  }

  public static fromJSON(json: UsersQueryJSON): UsersQuery {
    const { availability, ...rest } = json;
    return new UsersQuery({
      ...rest,
      ...super.fromJSON(json),
      availability: Availability.fromJSON(availability),
    });
  }

  public async search(
    pathname = '/api/users'
  ): Promise<{ users: User[]; hits: number }> {
    const [err, res] = await to<
      AxiosResponse<ListUsersRes>,
      AxiosError<ApiError>
    >(axios.get(this.getURL(pathname)));
    if (err && err.response) {
      console.error(`[ERROR] Search API responded: ${err.response.data.msg}`);
      throw new Error(err.response.data.msg);
    } else if (err && err.request) {
      console.error('[ERROR] Search API did not respond.');
      throw new Error('Search API did not respond.');
    } else if (err) {
      console.error('[ERROR] While sending request:', err);
      throw new Error(`While sending request: ${err.message}`);
    } else {
      const {
        data: { users, hits },
      } = res as AxiosResponse<ListUsersRes>;
      return { hits, users: users.map((u: UserJSON) => User.fromJSON(u)) };
    }
  }
}
