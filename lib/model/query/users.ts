import {
  Config,
  decode,
  encode,
  decodeBoolean,
  encodeBoolean,
  decodeAvailability,
  encodeAvailability,
  decodeArray,
  encodeArray,
  decodeString,
  encodeString,
  decodeNumber,
  encodeNumber,
} from 'lib/model/query/params';
import { Query, QueryInterface } from 'lib/model/query/base';
import { Availability } from 'lib/model/availability';
import { DBUserTag } from 'lib/model/user';
import construct from 'lib/model/construct';

export interface UsersQueryInterface extends QueryInterface {
  parents: string[];
  orgs: string[];
  tags: DBUserTag[];
  langs: string[];
  subjects: string[];
  availability: Availability;
  available?: boolean;
  visible?: boolean;
}

const config: Config<
  Omit<
    UsersQuery,
    'params' | 'endpoint' | 'query' | 'getURL' | 'getPaginationString'
  >
> = {
  search: ['', 's', encodeString, decodeString],
  hitsPerPage: [1000, 'h', encodeNumber, decodeNumber],
  page: [0, 'p', encodeNumber, decodeNumber],
  parents: [[], 'pp', encodeArray, decodeArray],
  orgs: [[], 'o', encodeArray, decodeArray],
  tags: [[], 't', encodeArray, decodeArray],
  langs: [[], 'l', encodeArray, decodeArray],
  subjects: [[], 'sb', encodeArray, decodeArray],
  availability: [[], 'a', encodeAvailability, decodeAvailability],
  available: [undefined, 'av', encodeBoolean, decodeBoolean],
  visible: [undefined, 'v', encodeBoolean, decodeBoolean],
};

export class UsersQuery extends Query implements UsersQueryInterface {
  public parents: string[] = [];

  public orgs: string[] = [];

  public tags: DBUserTag[] = [];

  public langs: string[] = [];

  public subjects: string[] = [];

  public availability: Availability = new Availability();

  public available?: boolean;

  public visible?: boolean;

  public constructor(query: Partial<UsersQueryInterface> = {}) {
    super(query);
    construct<QueryInterface>(this, query);
  }

  public get endpoint(): string {
    return `/api/users?${this.query}`;
  }

  public get params(): Record<string, string> {
    return encode(this, config);
  }

  public static params(params: Record<string, string>): UsersQuery {
    return new UsersQuery(decode(params, config));
  }
}
