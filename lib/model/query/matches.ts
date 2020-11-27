import url from 'url';

import { Option, Query, QueryInterface } from 'lib/model/query/base';
import construct from 'lib/model/construct';

// TODO: Should the `people` query be instead `UserOption` objects?
export interface MatchesQueryInterface extends QueryInterface {
  org?: string;
  people: Option<string>[];
}

export type MatchesQueryJSON = MatchesQueryInterface;

export type MatchesQueryURL = { [key in keyof MatchesQueryInterface]?: string };

// TODO: Implement this to verify that the given query params are valid.
export function isMatchesQueryURL(query: unknown): query is MatchesQueryURL {
  return true;
}

// TODO: Refactor the query data models as we never filter by multiple orgs for
// matches. Also, we want to minify the query URL (it's way to long right now).
export class MatchesQuery extends Query implements MatchesQueryInterface {
  public org?: string;

  public people: Option<string>[] = [];

  public constructor(query: Partial<MatchesQueryInterface> = {}) {
    super(query);
    construct<MatchesQueryInterface>(this, query);
  }

  public getURL(pathname: string): string {
    function encode(p?: Option<any>[]): string {
      return encodeURIComponent(JSON.stringify(p));
    }

    return url.format({
      pathname,
      query: {
        org: this.org || '',
        people: encode(this.people),
        query: encodeURIComponent(this.query),
        orgs: encode(this.orgs),
        tags: encode(this.tags),
        page: this.page,
        hitsPerPage: this.hitsPerPage,
      },
    });
  }

  public static fromURLParams(params: MatchesQueryURL): MatchesQuery {
    function decode<T = string>(p?: string): Option<T>[] {
      return p ? (JSON.parse(decodeURIComponent(p)) as Option<T>[]) : [];
    }

    return new MatchesQuery({
      ...super.fromURLParams(params),
      people: decode(params.people),
      org: params.org,
    });
  }

  public get endpoint(): string {
    return this.getURL('/api/matches');
  }

  public static fromJSON(json: MatchesQueryJSON): MatchesQuery {
    return new MatchesQuery(super.fromJSON(json));
  }
}
