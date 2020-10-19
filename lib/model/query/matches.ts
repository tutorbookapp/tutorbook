import url from 'url';

import {
  Option,
  Query,
  QueryInterface,
  QueryJSON,
  QueryURL,
} from 'lib/model/query/base';
import construct from 'lib/model/construct';

export interface MatchesQueryInterface extends QueryInterface {
  org: string;
}

export type MatchesQueryJSON = QueryJSON & { org: string };

export type MatchesQueryURL = QueryURL & { org?: string };

// TODO: Implement this to verify that the given query params are valid.
export function isMatchesQueryURL(query: unknown): query is MatchesQueryURL {
  return true;
}

export class MatchesQuery extends Query implements MatchesQueryInterface {
  public org = 'default';

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
        org: this.org,
        query: encodeURIComponent(this.query),
        orgs: encode(this.orgs),
        tags: encode(this.tags),
        page: this.page,
        hitsPerPage: this.hitsPerPage,
      },
    });
  }

  public static fromURLParams(params: MatchesQueryURL): MatchesQuery {
    return new MatchesQuery({
      ...super.fromURLParams(params),
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
