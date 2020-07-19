import url from 'url';
import to from 'await-to-js';
import axios, { AxiosResponse, AxiosError } from 'axios';

import { ListUsersRes } from 'lib/api/list-users';

import { ApiError } from './errors';
import { User, UserJSON, Check, Tag, Aspect } from './user';
import { Availability, AvailabilityJSON } from './availability';

import construct from './construct';

/**
 * All the supported filters for the search view.
 * @property query - The current string search query.
 * @property aspect - The currently filtered aspect (i.e. tutors or mentors).
 * @property langs - The languages that the user can speak; OR category.
 * @property subjects - The subjects the user can tutor/mentor for; OR category.
 * @property availability - When the user is available; OR category.
 * @property checks - The checks the user has passed; AND category.
 * @property parents - The parents that the user is a child to; OR category.
 * @property orgs - The organizations that the user belongs to; OR category.
 * @property tags - Algolia search `__tags` (e.g. `NOT_YET_VETTED`).
 * @property [visible] - Regular users can only ever see users where this is
 * `true`. Organization admins, however, can see all their users (regardless of
 * their visibility) which is why this property exists.
 * @property hitsPerPage - The number of hits to display per page (pagination).
 * @property page - The current page number (for pagination purposes).
 */
export interface QueryInterface {
  query: string;
  aspect: Aspect;
  langs: Option<string>[];
  subjects: Option<string>[];
  availability: Availability;
  checks: Option<Check>[];
  parents: Option<string>[];
  orgs: Option<string>[];
  tags: Option<Tag>[];
  visible?: boolean;
  hitsPerPage: number;
  page: number;
}

export type QueryJSON = Omit<QueryInterface, 'availability'> & {
  availability: AvailabilityJSON;
};

export interface Option<T> {
  label: string;
  value: T;
}

export type Callback<T> = (value: T) => void;

type QueryURL = { [key in keyof QueryInterface]?: string };

export class Query implements QueryInterface {
  public query = '';

  public aspect: Aspect = 'mentoring';

  public subjects: Option<string>[] = [];

  public availability: Availability = new Availability();

  public langs: Option<string>[] = [];

  public checks: Option<Check>[] = [];

  public parents: Option<string>[] = [];

  public orgs: Option<string>[] = [];

  public tags: Option<Tag>[] = [];

  public visible?: boolean;

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

  public get url(): string {
    return this.getURL('/search');
  }

  public get endpoint(): string {
    return this.getURL('/api/users');
  }

  public getPaginationString(hits: number): string {
    const begin: number = this.hitsPerPage * this.page + 1;
    const end: number = this.hitsPerPage * (this.page + 1);
    return `${begin}-${end > hits ? hits : end} of ${hits}`;
  }

  private getURL(pathname: string): string {
    function encode(p?: Option<any>[]): string {
      return encodeURIComponent(JSON.stringify(p));
    }

    return url.format({
      pathname,
      query: {
        query: encodeURIComponent(this.query),
        aspect: encodeURIComponent(this.aspect),
        langs: encode(this.langs),
        subjects: encode(this.subjects),
        availability: this.availability.toURLParam(),
        checks: encode(this.checks),
        parents: encode(this.parents),
        orgs: encode(this.orgs),
        tags: encode(this.tags),
        visible: this.visible,
        page: this.page,
        hitsPerPage: this.hitsPerPage,
      },
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

  public static fromURLParams(params: QueryURL): Query {
    function decode<T = string>(p?: string): Option<T>[] {
      return p ? (JSON.parse(decodeURIComponent(p)) as Option<T>[]) : [];
    }

    return new Query({
      query: decodeURIComponent(params.query || ''),
      parents: decode<Check>(params.parents),
      orgs: decode<Check>(params.orgs),
      checks: decode(params.checks),
      langs: decode(params.langs),
      subjects: decode(params.subjects),
      tags: decode(params.tags),
      visible: params.visible ? params.visible === 'true' : undefined,
      availability: params.availability
        ? Availability.fromURLParam(params.availability)
        : new Availability(),
      aspect: decodeURIComponent(params.aspect || 'mentoring') as Aspect,
      page: Number(decodeURIComponent(params.page || '0')),
      hitsPerPage: Number(decodeURIComponent(params.hitsPerPage || '20')),
    });
  }

  /**
   * Turns this `Query` object into an array of "stable" values that can be
   * passed around and compared to uniquely identify this `Query`.
   * @example
   * // You can do this because the `QueryDepArray` will be unique for each
   * // different query.
   * const { data: results } = useSWR(['/api/users', ...query.toDepArray]);
   * @deprecated Currently unused because we haven't implemented SWR in the
   * search view yet... but it's coming soon.
   * @see {@link https://github.com/vercel/swr#multiple-arguments}
   * @see {@link https://overreacted.io/a-complete-guide-to-useeffect/#but-i-cant-put-this-function-inside-an-effect}
   */
  public toDepArray(): QueryDepArray {
    const { aspect, subjects, availability, langs } = this;
    return [aspect, subjects, availability, langs];
  }

  public static fromDepArray(arr: QueryDepArray): Query {
    const [aspect, subjects, availability, langs] = arr;
    return new Query({ aspect, subjects, availability, langs });
  }

  public static fromJSON(json: QueryJSON): Query {
    const { availability, ...rest } = json;
    return new Query({
      ...rest,
      availability: Availability.fromJSON(availability),
    });
  }
}
