import { Availability, AvailabilityJSON } from 'lib/model/availability';
import { Option, Query, QueryInterface } from 'lib/model/query/base';
import { Aspect } from 'lib/model/aspect';
import construct from 'lib/model/construct';

/**
 * Various tags that are added to the Algolia users search during indexing (via
 * the `firebase/functions/src/algolia.ts` GCP serverless function).
 */
export type Tag = 'not-vetted';

/**
 * All the supported filters for the search view.
 * @extends {QueryInterface}
 * @property aspect - The currently filtered aspect (i.e. tutors or mentors).
 * @property langs - The languages that the user can speak; OR category.
 * @property subjects - The subjects the user can tutor/mentor for; OR category.
 * @property availability - When the user is available; OR category.
 * @property parents - The parents that the user is a child to; OR category.
 * @property [visible] - Regular users can only ever see users where this is
 * `true`. Organization admins, however, can see all their users (regardless of
 * their visibility) which is why this property exists.
 */
export interface UsersQueryInterface extends QueryInterface {
  orgs: Option<string>[];
  tags: Option<Tag>[];
  aspect: Aspect;
  langs: Option<string>[];
  subjects: Option<string>[];
  availability: Availability;
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
  public orgs: Option<string>[] = [];

  public tags: Option<Tag>[] = [];

  public aspect: Aspect = 'tutoring';

  public subjects: Option<string>[] = [];

  public availability: Availability = new Availability();

  public langs: Option<string>[] = [];

  public parents: Option<string>[] = [];

  public visible?: boolean;

  public constructor(query: Partial<UsersQueryInterface> = {}) {
    super(query);
    construct<QueryInterface>(this, query);
  }

  public get endpoint(): string {
    return this.getURL('/api/users');
  }

  // TODO: Use something like `serialize-query-params` to minify the way that
  // these are sent in URL parameters. Main obstacle would just be serializing
  // and deserializing the complex `Option` JSON objects.
  // @see {@link https://www.npmjs.com/package/serialize-query-params}
  // @see {@link https://github.com/pbeshai/use-query-params}
  protected getURLQuery(): Record<string, string | number | boolean> {
    function encode(p?: Option<any>[]): string {
      return encodeURIComponent(JSON.stringify(p));
    }

    const query = super.getURLQuery();
    if (this.orgs.length) query.orgs = encode(this.orgs);
    if (this.tags.length) query.tags = encode(this.tags);
    if (this.aspect !== 'tutoring') query.aspect = this.aspect;
    if (this.langs.length) query.langs = encode(this.langs);
    if (this.subjects.length) query.subjects = encode(this.subjects);
    if (this.availability.length)
      query.availability = this.availability.toURLParam();
    if (this.parents.length) query.parents = encode(this.parents);
    if (typeof this.visible === 'boolean') query.visible = this.visible;
    return query;
  }

  public static fromURLParams(params: UsersQueryURL): UsersQuery {
    function decode<T = string>(p?: string): Option<T>[] {
      return p ? (JSON.parse(decodeURIComponent(p)) as Option<T>[]) : [];
    }

    return new UsersQuery({
      ...super.fromURLParams(params),
      orgs: decode(params.orgs),
      tags: decode(params.tags),
      parents: decode(params.parents),
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
