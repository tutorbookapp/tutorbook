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

export class Query implements QueryInterface {
  public langs: Option<string>[] = [];

  public subjects: Option<string>[] = [];

  public availability: Availability = new Availability();

  public aspect: Aspect = 'mentoring';

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

  public static fromJSON(json: QueryJSON): Query {
    const { availability, ...rest } = json;
    return new Query({
      ...rest,
      availability: Availability.fromJSON(availability),
    });
  }
}
