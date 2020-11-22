import url from 'url';

import { Availability, AvailabilityJSON } from 'lib/model/availability';
import { Option, Query, QueryInterface } from 'lib/model/query/base';
import { Aspect } from 'lib/model/aspect';
import { Check } from 'lib/model/verification';
import construct from 'lib/model/construct';

/**
 * All the supported filters for the search view.
 * @extends {QueryInterface}
 * @property aspect - The currently filtered aspect (i.e. tutors or mentors).
 * @property langs - The languages that the user can speak; OR category.
 * @property subjects - The subjects the user can tutor/mentor for; OR category.
 * @property availability - When the user is available; OR category.
 * @property checks - The checks the user has passed; OR category.
 * @property parents - The parents that the user is a child to; OR category.
 * @property [visible] - Regular users can only ever see users where this is
 * `true`. Organization admins, however, can see all their users (regardless of
 * their visibility) which is why this property exists.
 */
export interface UsersQueryInterface extends QueryInterface {
  aspect: Aspect;
  langs: Option<string>[];
  subjects: Option<string>[];
  availability: Availability;
  checks: Option<Check>[];
  parents: Option<string>[];
  visible?: boolean;
}

export type UsersQueryJSON = Omit<UsersQueryInterface, 'availability'> & {
  availability: AvailabilityJSON;
};

export type UsersQueryURL = { [key in keyof UsersQueryInterface]?: string };

// TODO: Implement this to verify that the given query params are valid.
export function isUsersQueryURL(query: unknown): query is UsersQueryURL {
  return true;
}

export class UsersQuery extends Query implements UsersQueryInterface {
  public aspect: Aspect = 'tutoring';

  public subjects: Option<string>[] = [];

  public availability: Availability = new Availability();

  public langs: Option<string>[] = [];

  public checks: Option<Check>[] = [];

  public parents: Option<string>[] = [];

  public visible?: boolean;

  public constructor(query: Partial<UsersQueryInterface> = {}) {
    super(query);
    construct<QueryInterface>(this, query);
  }

  public get endpoint(): string {
    return this.getURL('/api/users');
  }

  public getURL(pathname: string): string {
    function encode(p?: Option<any>[]): string {
      return encodeURIComponent(JSON.stringify(p));
    }

    const query: Record<string, string | number | boolean> = {};
    if (this.query) query.query = encodeURIComponent(this.query);
    if (this.orgs.length) query.orgs = encode(this.orgs);
    if (this.tags.length) query.tags = encode(this.tags);
    if (this.page !== 0) query.page = this.page;
    if (this.hitsPerPage !== 20) query.hitsPerPage = this.hitsPerPage;
    if (this.aspect !== 'tutoring') query.aspect = this.aspect;
    if (this.langs.length) query.langs = encode(this.langs);
    if (this.subjects.length) query.subjects = encode(this.subjects);
    if (this.availability.length)
      query.availability = this.availability.toURLParam();
    if (this.checks.length) query.checks = encode(this.checks);
    if (this.parents.length) query.parents = encode(this.parents);
    if (typeof this.visible === 'boolean') query.visible = this.visible;

    return url.format({ pathname, query });
  }

  public static fromURLParams(params: UsersQueryURL): UsersQuery {
    function decode<T = string>(p?: string): Option<T>[] {
      return p ? (JSON.parse(decodeURIComponent(p)) as Option<T>[]) : [];
    }

    return new UsersQuery({
      ...super.fromURLParams(params),
      parents: decode<Check>(params.parents),
      checks: decode(params.checks),
      langs: decode(params.langs),
      subjects: decode(params.subjects),
      visible: params.visible ? params.visible === 'true' : undefined,
      availability: params.availability
        ? Availability.fromURLParam(params.availability)
        : new Availability(),
      aspect: (params.aspect as Aspect) || 'tutoring',
    });
  }

  public toJSON(): UsersQueryJSON {
    const { availability, ...rest } = this;
    return { ...rest, availability: availability.toJSON() };
  }

  public static fromJSON(json: UsersQueryJSON): UsersQuery {
    const { availability, ...rest } = json;
    return new UsersQuery({
      ...rest,
      ...super.fromJSON(json),
      availability: Availability.fromJSON(availability),
    });
  }
}
