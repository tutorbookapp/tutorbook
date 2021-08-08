import construct from 'lib/model/construct';

export interface QueryInterface {
  search: string;
  hitsPerPage: number;
  page: number;
}

export abstract class Query implements QueryInterface {
  public search = '';

  public hitsPerPage = 20;

  public page = 0;

  public constructor(query: Partial<QueryInterface> = {}) {
    construct<QueryInterface>(this, query);
  }

  public abstract get endpoint(): string;

  public abstract get params(): Record<string, string>;

  public get query(): string {
    const params = Object.entries(this.params);
    return params.map((entry) => entry.join('=')).join('&');
  }

  public getURL(pathname: string): string {
    return `${pathname}?${this.query}`;
  }

  public getPaginationString(hits: number): string {
    const begin: number = this.hitsPerPage * this.page + 1;
    const end: number = this.hitsPerPage * (this.page + 1);
    return `${begin}-${end > hits ? hits : end} of ${hits}`;
  }
}
