import { Query, QueryInterface, QueryJSON, QueryURL } from './base';

export type MatchesQueryInterface = QueryInterface;

export type MatchesQueryJSON = QueryJSON;

export type MatchesQueryURL = QueryURL;

// TODO: Implement this to verify that the given query params are valid.
export function isMatchesQueryURL(query: unknown): query is MatchesQueryURL {
  return true;
}

export class MatchesQuery extends Query implements MatchesQueryInterface {
  public get endpoint(): string {
    return this.getURL('/api/matches');
  }

  public static fromURLParams(params: MatchesQueryURL): MatchesQuery {
    return new MatchesQuery(super.fromURLParams(params));
  }

  public static fromJSON(json: MatchesQueryJSON): MatchesQuery {
    return new MatchesQuery(super.fromJSON(json));
  }
}
