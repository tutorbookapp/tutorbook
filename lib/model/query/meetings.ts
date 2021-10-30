import {
  Config,
  decode,
  decodeArray,
  decodeDate,
  decodeNumber,
  decodeString,
  decodeSubjects,
  encode,
  encodeArray,
  encodeDate,
  encodeNumber,
  encodeString,
  encodeSubjects,
} from 'lib/model/query/params';
import { Query, QueryInterface } from 'lib/model/query/base';
import { DBMeetingTag } from 'lib/model/meeting';
import { Subject } from 'lib/model/subject';
import construct from 'lib/model/construct';

export interface MeetingsQueryInterface extends QueryInterface {
  org?: string;
  people: string[];
  subjects: Subject[];
  tags: DBMeetingTag[];
  from: Date;
  to: Date;
}

const config: Config<
  Omit<
    MeetingsQuery,
    'params' | 'endpoint' | 'query' | 'getURL' | 'getPaginationString'
  >
> = {
  search: ['', 's', encodeString, decodeString],
  hitsPerPage: [1000, 'h', encodeNumber, decodeNumber],
  page: [0, 'p', encodeNumber, decodeNumber],
  org: [undefined, 'o', encodeString, decodeString],
  people: [[], 'pl', encodeArray, decodeArray],
  subjects: [[], 'sb', encodeSubjects, decodeSubjects],
  tags: [[], 'tg', encodeArray, decodeArray],
  from: [
    new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      new Date().getDate() - new Date().getDay()
    ),
    'f',
    encodeDate,
    decodeDate,
  ],
  to: [
    new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      new Date().getDate() - new Date().getDay() + 7
    ),
    't',
    encodeDate,
    decodeDate,
  ],
};

export class MeetingsQuery extends Query implements MeetingsQueryInterface {
  public org?: string;

  public people: string[] = [];

  public subjects: Subject[] = [];

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

  public get endpoint(): string {
    return this.getURL('/api/meetings');
  }

  public get params(): Record<string, string> {
    return encode(this, config);
  }

  public static params(params: Record<string, string>): MeetingsQuery {
    return new MeetingsQuery(decode(params, config));
  }
}
