import {
  Query,
  QueryInterface,
  QueryJSON,
  QueryURL,
} from 'lib/model/query/base';

export type RequestsQueryInterface = QueryInterface;

export type RequestsQueryJSON = QueryJSON;

export type RequestsQueryURL = QueryURL;

// TODO: Implement this to verify that the given query params are valid.
export function isRequestsQueryURL(query: unknown): query is RequestsQueryURL {
  return true;
}

export class RequestsQuery extends Query implements RequestsQueryInterface {
  public get endpoint(): string {
    return this.getURL('/api/requests');
  }

  public static fromURLParams(params: RequestsQueryURL): RequestsQuery {
    return new RequestsQuery(super.fromURLParams(params));
  }

  public static fromJSON(json: RequestsQueryJSON): RequestsQuery {
    return new RequestsQuery(super.fromJSON(json));
  }
}
