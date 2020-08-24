import url from 'url';

import axios, { AxiosError, AxiosResponse } from 'axios';
import to from 'await-to-js';

import { ListUsersRes } from 'lib/api/list-users';

import { Availability, AvailabilityJSON } from '../availability';
import { Aspect, Check, User, UserJSON } from '../user';
import { ApiError } from '../errors';
import construct from '../construct';

import { Option, Query, QueryInterface } from './base';

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

export class UsersQuery extends Query implements UsersQueryInterface {
  public aspect: Aspect = 'tutoring';

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
