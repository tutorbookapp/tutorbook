import { Query, QueryInterface, QueryJSON, QueryURL } from './base';

export type MatchesQueryInterface = QueryInterface;

export type MatchesQueryJSON = QueryJSON;

export type MatchesQueryURL = QueryURL;

// TODO: Implement this to actually verify that the given JSON is valid.
export function isMatchesQueryJSON(json: unknown): json is MatchesQueryJSON {
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
