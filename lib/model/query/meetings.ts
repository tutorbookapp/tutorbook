import { Option, Query, QueryInterface } from 'lib/model/query/base';
import { DBMeetingTag } from 'lib/model/meeting';
import { User } from 'lib/model/user';
import construct from 'lib/model/construct';

export interface MeetingsQueryInterface extends QueryInterface {
  org?: string;
  people: Option<User>[];
  subjects: Option<string>[];
  tags: DBMeetingTag[];
  from: Date;
  to: Date;
}

export type MeetingsQueryJSON = Omit<MeetingsQueryInterface, 'from' | 'to'> & {
  from: string;
  to: string;
};
export type MeetingsQueryURL = {
  [key in keyof MeetingsQueryInterface]?: string;
};

// TODO: Implement this to verify that the given query params are valid.
export function isMeetingsQueryURL(query: unknown): query is MeetingsQueryURL {
  return true;
}

export class MeetingsQuery extends Query implements MeetingsQueryInterface {
  public org?: string;

  public people: Option<User>[] = [];

  public subjects: Option<string>[] = [];

  public tags: DBMeetingTag[] = [];

  // Start query on the most recent Sunday at 12am.
  public from = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    new Date().getDate() - new Date().getDay()
  );

  // End query on the next Sunday at 12am (instead of Saturday 11:59:59.99).
  public to = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    new Date().getDate() - new Date().getDay() + 7
  );

  // TODO: Will there ever be more than 1000 meetings to display at once?
  public hitsPerPage = 1000;

  public constructor(query: Partial<MeetingsQueryInterface> = {}) {
    super(query);
    construct<MeetingsQueryInterface>(this, query);
  }

  public getURLParams(): Record<string, string | number | boolean> {
    function encode(p?: any[]): string {
      return encodeURIComponent(JSON.stringify(p));
    }

    const query = super.getURLParams();
    if (this.hitsPerPage !== 1000) {
      query.hitsPerPage = this.hitsPerPage;
    } else {
      delete query.hitsPerPage;
    }
    if (this.org) query.org = encodeURIComponent(this.org);
    if (this.people.length) query.people = encode(this.people);
    if (this.subjects.length) query.subjects = encode(this.subjects);
    if (this.tags.length) query.tags = encode(this.tags);
    query.from = this.from.toJSON();
    query.to = this.to.toJSON();
    return query;
  }

  public static fromURLParams(params: MeetingsQueryURL): MeetingsQuery {
    function decode<T>(p?: string): T[] {
      return p ? (JSON.parse(decodeURIComponent(p)) as T[]) : [];
    }

    return new MeetingsQuery({
      ...Query.fromURLParams(params),
      people: decode(params.people),
      subjects: decode(params.subjects),
      org: params.org ? decodeURIComponent(params.org) : undefined,
      tags: decode<DBMeetingTag>(params.tags),
      from: new Date(params.from || new Date().toJSON()),
      to: new Date(params.to || new Date().toJSON()),
      hitsPerPage: Number(decodeURIComponent(params.hitsPerPage || '1000')),
    });
  }

  public get endpoint(): string {
    return this.getURL('/api/meetings');
  }

  public static fromJSON(json: MeetingsQueryJSON): MeetingsQuery {
    return new MeetingsQuery({
      ...json,
      ...Query.fromJSON(json),
      from: new Date(json.from),
      to: new Date(json.to),
    });
  }
}
