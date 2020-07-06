import url from 'url';
import to from 'await-to-js';
import axios, { AxiosResponse, AxiosError } from 'axios';

import { ApiError } from './errors';
import { User, UserJSON, Check, Tag, Aspect } from './user';
import { Availability, AvailabilityJSON } from './availability';

/**
 * All the supported filters for the search view.
 * @property aspect - The currently filtered aspect (i.e. tutors or mentors).
 * @property langs - The languages that the user can speak; OR category.
 * @property subjects - The subjects the user can tutor/mentor for; OR category.
 * @property availability - When the user is available; OR category.
 * @property checks - The checks the user has passed; AND category.
 * @property orgs - The organizations that the user belongs to; OR category.
 * @property tags - Algolia search `__tags` (e.g. `NOT_YET_VETTED`).
 * @property [visible] - Regular users can only ever see users where this is
 * `true`. Organization admins, however, can see all their users (regardless of
 * their visibility) which is why this property exists.
 */
export interface QueryInterface {
  aspect: Aspect;
  langs: Option<string>[];
  subjects: Option<string>[];
  availability: Availability;
  checks: Option<Check>[];
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

// [aspect, subjects, availability, langs]
export type QueryDepArray = [
  Aspect,
  Option<string>[],
  Availability,
  Option<string>[]
];

type QueryURL = { [key in keyof QueryInterface]?: string };

export class Query implements QueryInterface {
  public aspect: Aspect = 'mentoring';

  public subjects: Option<string>[] = [];

  public availability: Availability = new Availability();

  public langs: Option<string>[] = [];

  public checks: Option<Check>[] = [];

  public orgs: Option<string>[] = [];

  public tags: Option<Tag>[] = [];

  public visible?: boolean;

  // The number of hits per page (for pagination purposes).
  // @see {@link https://www.algolia.com/doc/guides/building-search-ui/going-further/backend-search/how-to/pagination/}
  // @see {@link https://www.algolia.com/doc/api-reference/api-parameters/hitsPerPage/}
  public hitsPerPage = 20;

  public page = 1;

  public constructor(query: Partial<QueryInterface> = {}) {
    Object.entries(query).forEach(([key, val]: [string, any]) => {
      const valid: boolean = typeof val === 'boolean' || !!val;
      /* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */
      if (valid && key in this) (this as Record<string, any>)[key] = val;
    });
  }

  public get url(): string {
    return this.getURL('/search');
  }

  public get endpoint(): string {
    return this.getURL('/api/users');
  }

  private getURL(pathname: string): string {
    function encode(p?: Option<any>[]): string {
      return encodeURIComponent(JSON.stringify(p));
    }

    return url.format({
      pathname,
      query: {
        aspect: encodeURIComponent(this.aspect),
        langs: encode(this.langs),
        subjects: encode(this.subjects),
        availability: this.availability.toURLParam(),
        checks: encode(this.checks),
        orgs: encode(this.orgs),
        tags: encode(this.tags),
        visible: this.visible,
      },
    });
  }

  public async search(pathname = '/api/users'): Promise<ReadonlyArray<User>> {
    const [err, res] = await to<
      AxiosResponse<UserJSON[]>,
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
      return (res as AxiosResponse<UserJSON[]>).data.map((user: UserJSON) =>
        User.fromJSON(user)
      );
    }
  }

  public static fromURLParams(params: QueryURL): Query {
    function decode<T = string>(p?: string): Option<T>[] {
      return p ? (JSON.parse(decodeURIComponent(p)) as Option<T>[]) : [];
    }

    return new Query({
      orgs: decode<Check>(params.orgs),
      checks: decode(params.checks),
      langs: decode(params.langs),
      subjects: decode(params.subjects),
      availability: params.availability
        ? Availability.fromURLParam(params.availability)
        : new Availability(),
      aspect: params.aspect
        ? (decodeURIComponent(params.aspect) as Aspect)
        : 'mentoring',
      tags: decode(params.tags),
      visible: params.visible ? params.visible === 'true' : undefined,
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
