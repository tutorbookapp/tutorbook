import url from 'url';

import { Check, Tag } from '../user';
import construct from '../construct';

export interface Option<T> {
  label: string;
  value: T;
}

/**
 * The base object just supports pagination, text-based search, and tag filters.
 * @abstract
 * @property query - The current string search query.
 * @property orgs - The organizations that the resource belongs to.
 * @property tags - Algolia search `__tags` (e.g. `NOT_YET_VETTED`).
 * @property hitsPerPage - The number of hits to display per page (pagination).
 * @property page - The current page number (for pagination purposes).
 */
export interface QueryInterface {
  query: string;
  orgs: Option<string>[];
  tags: Option<Tag>[];
  hitsPerPage: number;
  page: number;
}

export type QueryJSON = QueryInterface;

export type QueryURL = { [key in keyof QueryInterface]?: string };

export abstract class Query implements QueryInterface {
  public query = '';

  public orgs: Option<string>[] = [];

  public tags: Option<Tag>[] = [];

  // The number of hits per page (for pagination purposes).
  // @see {@link https://www.algolia.com/doc/guides/building-search-ui/going-further/backend-search/how-to/pagination/}
  // @see {@link https://www.algolia.com/doc/api-reference/api-parameters/hitsPerPage/}
  public hitsPerPage = 20;

  // The current page number. For some CS-related reason, Algolia starts
  // counting page numbers from 0 instead of 1.
  // @see {@link https://www.algolia.com/doc/api-reference/api-parameters/page/}
  public page = 0;

  public constructor(query: Partial<QueryInterface> = {}) {
    construct<QueryInterface>(this, query);
  }

  public abstract get endpoint(): string;

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
      },
    });
  }

  public static fromURLParams(params: QueryURL): QueryInterface {
    function decode<T = string>(p?: string): Option<T>[] {
      return p ? (JSON.parse(decodeURIComponent(p)) as Option<T>[]) : [];
    }

    return {
      query: decodeURIComponent(params.query || ''),
      orgs: decode<Check>(params.orgs),
      tags: decode(params.tags),
      page: Number(decodeURIComponent(params.page || '0')),
      hitsPerPage: Number(decodeURIComponent(params.hitsPerPage || '20')),
    };
  }

  public static fromJSON(json: QueryJSON): QueryInterface {
    return json;
  }

  public getPaginationString(hits: number): string {
    const begin: number = this.hitsPerPage * this.page + 1;
    const end: number = this.hitsPerPage * (this.page + 1);
    return `${begin}-${end > hits ? hits : end} of ${hits}`;
  }
}
