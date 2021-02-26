import { Aspect, isAspect } from 'lib/model/aspect';
import { Availability, AvailabilityJSON } from 'lib/model/availability';
import { Option, Query, QueryInterface } from 'lib/model/query/base';
import construct from 'lib/model/construct';

/**
 * Various tags that are added to the Algolia users search during indexing (via
 * the `lib/api/algolia.ts` API back-end module).
 * @property not-vetted - User doesn't have any verifications.
 * @property tutor - User is a tutor in at least one match.
 * @property tutee - User is a tutee in at least one match.
 * @property mentor - User is a mentor in at least one match.
 * @property mentee - User is a mentee in at least one match.
 */
export type Tag = 'not-vetted' | 'tutor' | 'tutee' | 'mentor' | 'mentee';

/**
 * All the supported filters for the search view.
 * @extends {QueryInterface}
 * @property aspect - Whether to filter by mentoring or tutoring subjects.
 * @property langs - The languages that the user can speak.
 * @property subjects - Subjects that the user can tutor or mentor.
 * @property availability - When the user is available.
 * @property [visible] - Regular users can only ever see users where this is
 * `true`. Organization admins, however, can see all their users (regardless of
 * their visibility) which is why this property exists.
 */
export interface UsersQueryInterface extends QueryInterface {
  orgs: string[];
  tags: Tag[];
  aspect: Aspect;
  langs: Option<string>[];
  subjects: Option<string>[];
  availability: Availability;
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
  public orgs: string[] = [];

  public tags: Tag[] = [];

  public aspect: Aspect = 'tutoring';

  public langs: Option<string>[] = [];

  public subjects: Option<string>[] = [];

  public availability: Availability = new Availability();

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
    function encode(p?: any[]): string {
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
    if (typeof this.visible === 'boolean') query.visible = this.visible;
    return query;
  }

  public static fromURLParams(params: UsersQueryURL): UsersQuery {
    function decode<T>(p?: string): T[] {
      return p ? (JSON.parse(decodeURIComponent(p)) as T[]) : [];
    }

    return new UsersQuery({
      ...super.fromURLParams(params),
      orgs: decode<string>(params.orgs),
      tags: decode<Tag>(params.tags),
      langs: decode<Option<string>>(params.langs),
      subjects: decode<Option<string>>(params.subjects),
      visible: params.visible ? params.visible === 'true' : undefined,
      availability: params.availability
        ? Availability.fromURLParam(params.availability)
        : new Availability(),
      aspect: isAspect(params.aspect) ? params.aspect : 'tutoring',
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
