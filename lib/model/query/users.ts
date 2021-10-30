import {
  Config,
  decode,
  decodeArray,
  decodeAvailability,
  decodeBoolean,
  decodeNumber,
  decodeOptionalBool,
  decodeString,
  decodeSubjects,
  encode,
  encodeArray,
  encodeAvailability,
  encodeBoolean,
  encodeNumber,
  encodeOptionalBool,
  encodeString,
  encodeSubjects,
} from 'lib/model/query/params';
import { DBUserTag, Role } from 'lib/model/user';
import { Query, QueryInterface } from 'lib/model/query/base';
import { Availability } from 'lib/model/availability';
import { Subject } from 'lib/model/subject';
import construct from 'lib/model/construct';

/**
 * @typedef {UsersQueryInterface}
 * @property parents - Show users who have these parents.
 * @property orgs - Show users who are a part of one of these orgs.
 * @property tags - Show users who have these tags.
 * @property langs - Show users who can speak these languages.
 * @property subjects - Show users who can tutor these subjects.
 * @property availability - Show users who are available at these times.
 * @property [available] - Only show users who have availability.
 * @property [visible] - Only show users who are "visible in search".
 * @property [met] - Show people who have met with this person.
 */
export interface UsersQueryInterface extends QueryInterface {
  parents: string[];
  orgs: string[];
  tags: DBUserTag[];
  langs: string[];
  subjects: Subject[];
  availability: Availability;
  available?: boolean;
  visible?: boolean;
  met?: [string, Role];
}

const config: Config<
  Omit<
    UsersQuery,
    'params' | 'endpoint' | 'query' | 'getURL' | 'getPaginationString'
  >
> = {
  search: ['', 's', encodeString, decodeString],
  hitsPerPage: [20, 'h', encodeNumber, decodeNumber],
  page: [0, 'p', encodeNumber, decodeNumber],
  parents: [[], 'pp', encodeArray, decodeArray],
  orgs: [[], 'o', encodeArray, decodeArray],
  tags: [[], 't', encodeArray, decodeArray],
  langs: [[], 'l', encodeArray, decodeArray],
  subjects: [[], 'sb', encodeSubjects, decodeSubjects],
  availability: [
    new Availability(),
    'a',
    encodeAvailability,
    decodeAvailability,
  ],
  available: [undefined, 'av', encodeBoolean, decodeBoolean],
  visible: [true, 'v', encodeOptionalBool, decodeOptionalBool],
  met: [undefined, 'm', encodeArray, decodeArray],
};

export class UsersQuery extends Query implements UsersQueryInterface {
  public parents: string[] = [];

  public orgs: string[] = [];

  public tags: DBUserTag[] = [];

  public langs: string[] = [];

  public subjects: Subject[] = [];

  public availability: Availability = new Availability();

  public available?: boolean;

  public visible?: boolean = true;

  public met?: [string, Role];

  public constructor(query: Partial<UsersQueryInterface> = {}) {
    super(query);
    construct<QueryInterface>(this, query);
  }

  public get endpoint(): string {
    return this.getURL('/api/users');
  }

  public get params(): Record<string, string> {
    return encode(this, config);
  }

  public static params(params: Record<string, string>): UsersQuery {
    return new UsersQuery(decode(params, config));
  }
}
