import url from 'url';
import to from 'await-to-js';
import axios, { AxiosResponse, AxiosError } from 'axios';
import { ParsedUrlQuery } from 'querystring';

import { ApiError } from './api';
import { User, UserJSON, Check, Aspect } from './user';
import { Availability, AvailabilityJSONAlias } from './times';

/**
 * All the supported filters for the search view.
 * @property aspect - The currently filtered aspect (i.e. tutors or mentors).
 * @property langs - The languages that the user can speak; OR category.
 * @property subjects - The subjects the user can tutor/mentor for; OR category.
 * @property availability - When the user is available; OR category.
 * @property checks - The checks the user has passed; AND category.
 * @property orgs - The organizations that the user belongs to; OR category.
 */
export interface QueryInterface {
  aspect: Aspect;
  langs: Option<string>[];
  subjects: Option<string>[];
  availability: Availability;
  checks: Option<Check>[];
  orgs: Option<string>[];
}

export interface QueryJSON {
  aspect: Aspect;
  langs: Option<string>[];
  subjects: Option<string>[];
  availability: AvailabilityJSONAlias;
  checks: Option<Check>[];
  orgs: Option<string>[];
}

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

export class Query implements QueryInterface {
  public aspect: Aspect = 'mentoring';

  public subjects: Option<string>[] = [];

  public availability: Availability = new Availability();

  public langs: Option<string>[] = [];

  public checks: Option<Check>[] = [];

  public orgs: Option<string>[] = [];

  public constructor(query: Partial<QueryInterface> = {}) {
    Object.entries(query).forEach(([key, val]: [string, any]) => {
      /* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */
      if (val && key in this) (this as Record<string, any>)[key] = val;
    });
  }

  public get url(): string {
    return url.format({
      pathname: '/search',
      query: {
        aspect: encodeURIComponent(this.aspect),
        langs: encodeURIComponent(JSON.stringify(this.langs)),
        subjects: encodeURIComponent(JSON.stringify(this.subjects)),
        availability: this.availability.toURLParam(),
        checks: encodeURIComponent(JSON.stringify(this.checks)),
        orgs: encodeURIComponent(JSON.stringify(this.orgs)),
      },
    });
  }

  public async search(endpoint = '/api/users'): Promise<ReadonlyArray<User>> {
    const [err, res] = await to<
      AxiosResponse<UserJSON[]>,
      AxiosError<ApiError>
    >(
      axios({
        url: endpoint,
        method: 'get',
        params: {
          aspect: encodeURIComponent(this.aspect),
          langs: encodeURIComponent(JSON.stringify(this.langs)),
          subjects: encodeURIComponent(JSON.stringify(this.subjects)),
          availability: this.availability.toURLParam(),
          checks: encodeURIComponent(JSON.stringify(this.checks)),
          orgs: encodeURIComponent(JSON.stringify(this.orgs)),
        },
      })
    );
    if (err && err.response) {
      console.error(`[ERROR] ${err.response.data.msg}`);
      throw new Error(err.response.data.msg);
    } else if (err && err.request) {
      console.error('[ERROR] Search REST API did not respond:', err.request);
      throw new Error('Search REST API did not respond.');
    } else if (err) {
      console.error('[ERROR] While sending request:', err);
      throw new Error(`While sending request: ${err.message}`);
    } else {
      return (res as AxiosResponse<UserJSON[]>).data.map((user: UserJSON) =>
        User.fromJSON(user)
      );
    }
  }

  public static fromURLParams(params: ParsedUrlQuery): Query {
    const orgs: string = params.orgs as string;
    const checks: string = params.checks as string;
    const langs: string = params.langs as string;
    const aspect: string = params.aspect as string;
    const subjects: string = params.subjects as string;
    const availability: string = params.availability as string;
    return new Query({
      orgs: orgs
        ? (JSON.parse(decodeURIComponent(orgs)) as Option<string>[])
        : [],
      checks: checks
        ? (JSON.parse(decodeURIComponent(checks)) as Option<Check>[])
        : [],
      langs: langs
        ? (JSON.parse(decodeURIComponent(langs)) as Option<string>[])
        : [],
      subjects: subjects
        ? (JSON.parse(decodeURIComponent(subjects)) as Option<string>[])
        : [],
      availability: availability
        ? Availability.fromURLParam(availability)
        : new Availability(),
      aspect: aspect ? (decodeURIComponent(aspect) as Aspect) : 'mentoring',
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
