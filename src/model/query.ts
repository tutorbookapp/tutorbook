import url from 'url';

import { Availability, TimeslotJSONInterface } from './times';

export type Aspect = 'mentoring' | 'tutoring';

export interface QueryInterface {
  langs: Option<string>[];
  subjects: Option<string>[];
  availability: Availability;
  aspect: Aspect;
}

export interface QueryJSON {
  langs: Option<string>[];
  subjects: Option<string>[];
  availability: TimeslotJSONInterface[];
  aspect: Aspect;
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
        subjects: encodeURIComponent(JSON.stringify(this.subjects)),
        availability: this.availability.toURLParam(),
      },
    });
  }

  /**
   * Turns this `Query` object into an array of "stable" values that can be
   * passed around and compared to uniquely identify this `Query`.
   * @example
   * // You can do this because the `QueryDepArray` will be unique for each
   * // different query.
   * const { data: results } = useSWR(['/api/search', ...query.toDepArray]);
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
