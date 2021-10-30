import {
  Config,
  decode,
  decodeNumber,
  decodeString,
  decodeSubjects,
  encode,
  encodeNumber,
  encodeString,
  encodeSubjects,
} from 'lib/model/query/params';
import { Subject } from 'lib/model/subject';
import { Query, QueryInterface } from 'lib/model/query/base';
import construct from 'lib/model/construct';

export interface SubjectsQueryInterface extends QueryInterface {
  options?: Subject[];
}

const config: Config<
  Omit<
    SubjectsQuery,
    'params' | 'endpoint' | 'query' | 'getURL' | 'getPaginationString'
  >
> = {
  search: ['', 's', encodeString, decodeString],
  hitsPerPage: [20, 'h', encodeNumber, decodeNumber],
  page: [0, 'p', encodeNumber, decodeNumber],
  options: [undefined, 'o', encodeSubjects, decodeSubjects],
};

export class SubjectsQuery extends Query implements SubjectsQueryInterface {
  public options?: Subject[];

  public constructor(query: Partial<SubjectsQueryInterface> = {}) {
    super(query);
    construct<QueryInterface>(this, query);
  }

  public get endpoint(): string {
    return this.getURL('/api/subjects');
  }

  public get params(): Record<string, string> {
    return encode(this, config);
  }

  public static params(params: Record<string, string>): SubjectsQuery {
    return new SubjectsQuery(decode(params, config));
  }
}
