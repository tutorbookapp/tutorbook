import {
  Account,
  AccountInterface,
  AccountJSON,
  isAccountJSON,
} from 'lib/model/account';
import {
  Availability,
  AvailabilityJSON,
  isAvailabilityJSON,
} from 'lib/model/availability';
import { DBDate, DBTimeslot } from 'lib/model/timeslot';
import {
  Verification,
  VerificationJSON,
  isVerificationJSON,
} from 'lib/model/verification';
import { caps, join, notTags } from 'lib/utils';
import { isArray, isJSON, isStringArray } from 'lib/model/json';
import clone from 'lib/utils/clone';
import construct from 'lib/model/construct';
import definedVals from 'lib/model/defined-vals';

export type Role = 'tutor' | 'tutee' | 'parent';
export function isRole(role: unknown): role is Role {
  if (typeof role !== 'string') return false;
  return ['tutor', 'tutee', 'parent'].includes(role);
}

/**
 * Various tags that are added to the Algolia users search during indexing (via
 * the `lib/api/algolia.ts` API back-end module). For in-depth explanations of
 * each one, reference the link included below.
 * @see {@link https://github.com/tutorbookapp/tutorbook/tree/TAGS.md}
 */
export type UserTag =
  | 'vetted' // Has at least one verification.
  | 'meeting' // Has at least one meeting.
  | Role; // Has this role in at least one match.

export type DBUserTag =
  | UserTag
  | 'not-tutor'
  | 'not-tutee'
  | 'not-parent'
  | 'not-vetted'
  | 'not-meeting';

export const USER_TAGS: UserTag[] = [
  'tutor',
  'tutee',
  'parent',
  'vetted',
  'meeting',
];

export function isUserTag(tag: unknown): tag is UserTag {
  if (typeof tag !== 'string') return false;
  return ['vetted', 'meeting'].includes(tag) || isRole(tag);
}

/**
 * Right now, we only support traditional K-12 grade levels (e.g. 'Freshman'
 * maps to the number 9).
 * @todo Perhaps support other grade levels and other educational systems (e.g.
 * research how other countries do grade levels).
 */
export type GradeAlias = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

/**
 * A user object.
 * @typedef {Object} UserInterface
 * @extends AccountInterface
 * @property [age] - The user's age (mostly used for students).
 * @property orgs - An array of the IDs of the orgs this user belongs to.
 * @property availability - An array of `Timeslot`'s when the user is free.
 * @property subjects - The subjects that the user can tutor for.
 * @property langs - The languages (as ISO codes) the user can speak fluently.
 * @property parents - The Firebase uIDs of linked parent accounts.
 * @property visible - Whether or not this user appears in search results.
 * @property roles - Always empty unless in context of match or request.
 * @property tags - An array of user tags used for analytics and filtering.
 * @property reference - How the user heard about TB or the org they're joining.
 * @property timezone - The user's time zone (e.g. America/Los_Angeles). This is
 * collected by our front-end and used by our back-end when sending reminders.
 * @property [token] - The user's Firebase Authentication JWT `idToken`.
 * @property [hash] - The user's Intercom HMAC for identity verifications.
 */
export interface UserInterface extends AccountInterface {
  age?: number;
  orgs: string[];
  availability: Availability;
  subjects: string[];
  langs: string[];
  parents: string[];
  verifications: Verification[];
  visible: boolean;
  roles: Role[];
  tags: UserTag[];
  reference: string;
  timezone: string;
  token?: string;
  hash?: string;
}

export interface DBSocial {
  type:
    | 'website'
    | 'linkedin'
    | 'twitter'
    | 'facebook'
    | 'instagram'
    | 'github'
    | 'indiehackers';
  url: string;
}
export interface DBUser {
  id: string;
  uid: string | null;
  name: string;
  photo: string | null;
  email: string | null;
  phone: string | null;
  bio: string;
  background: string | null;
  venue: string | null;
  socials: DBSocial[];
  availability: DBTimeslot[];
  subjects: string[];
  langs: string[];
  visible: boolean;
  reference: string;
  timezone: string | null;
  age: number | null;
  tags: DBUserTag[];
  created: DBDate;
  updated: DBDate;
  times: number[];
}
export interface DBViewUser extends DBUser {
  orgs: string[] | null;
  parents: string[] | null;
  available: boolean;
}
export interface DBPerson extends DBUser {
  roles: Role[] | null;
}
export interface DBRelationParent {
  user: string;
  parent: string;
}
export interface DBRelationOrg {
  user: string;
  org: string;
}

export type UserJSON = Omit<
  UserInterface,
  keyof Account | 'availability' | 'verifications'
> &
  AccountJSON & {
    availability: AvailabilityJSON;
    verifications: VerificationJSON[];
  };

export function isUserJSON(json: unknown): json is UserJSON {
  if (!isAccountJSON(json)) return false;
  if (!isJSON(json)) return false;
  if (json.age && typeof json.age !== 'number') return false;
  if (!isStringArray(json.orgs)) return false;
  if (!isAvailabilityJSON(json.availability)) return false;
  if (!isStringArray(json.subjects)) return false;
  if (!isStringArray(json.langs)) return false;
  if (!isStringArray(json.parents)) return false;
  if (!isArray(json.verifications, isVerificationJSON)) return false;
  if (typeof json.visible !== 'boolean') return false;
  if (!isArray(json.roles, isRole)) return false;
  if (!isArray(json.tags, isUserTag)) return false;
  if (typeof json.reference !== 'string') return false;
  if (typeof json.timezone !== 'string') return false;
  if (json.token && typeof json.token !== 'string') return false;
  if (json.hash && typeof json.hash !== 'string') return false;
  return true;
}

/**
 * Class that provides default values for our `UserInterface` data model.
 * @see {@link https://stackoverflow.com/a/54857125/10023158}
 */
export class User extends Account implements UserInterface {
  public age?: number;

  public orgs: string[] = [];

  public availability: Availability = new Availability();

  public subjects: string[] = [];

  public langs: string[] = ['en'];

  public parents: string[] = [];

  public verifications: Verification[] = [];

  public visible = false;

  public roles: Role[] = [];

  public tags: UserTag[] = [];

  public reference = '';

  public timezone = 'America/Los_Angeles';

  public token?: string;

  public hash?: string;

  /**
   * Creates a new `User` object by overriding all of our default values w/ the
   * values contained in the given `UserInterface` object.
   *
   * Note that this constructor will also normalize any given `phone` values to
   * the standard [E.164 format]{@link https://en.wikipedia.org/wiki/E.164}.
   *
   * @todo Perhaps add an explicit check to ensure that the given `val`'s type
   * matches the default value at `this[key]`'s type; and then only update the
   * default value if the types match.
   */
  public constructor(user: Partial<UserInterface> = {}) {
    super(user);
    construct<UserInterface, AccountInterface>(this, user, new Account());
  }

  public get clone(): User {
    return new User(clone(this));
  }

  // TODO: Perform these name styling changes from our back-end when validating
  // the user's request data (i.e. capitalize it and then send it back).
  public get firstName(): string {
    return caps(this.name.split(' ')[0] || '');
  }

  public get lastName(): string {
    const parts: string[] = this.name.split(' ');
    return caps(parts[parts.length - 1] || '');
  }

  public toDB(): DBUser {
    return {
      id: this.id,
      uid: null,
      name: this.name,
      photo: this.photo || null,
      email: this.email || null,
      phone: this.phone || null,
      bio: this.bio,
      background: this.background || null,
      venue: this.venue || null,
      socials: this.socials,
      availability: this.availability.toDB(),
      subjects: this.subjects,
      langs: this.langs,
      visible: this.visible,
      reference: this.reference,
      timezone: this.timezone || null,
      age: this.age || null,
      tags: [...this.tags, ...notTags(this.tags, USER_TAGS)],
      created: this.created.toISOString(),
      updated: this.updated.toISOString(),
      times: [],
    };
  }

  public static fromDB(record: DBUser | DBViewUser | DBPerson): User {
    return new User({
      id: record.id,
      name: record.name,
      photo: record.photo || '',
      email: record.email || '',
      phone: record.phone || '',
      bio: record.bio,
      background: record.background || '',
      venue: record.venue || '',
      socials: record.socials,
      availability: Availability.fromDB(record.availability),
      subjects: record.subjects,
      langs: record.langs,
      visible: record.visible,
      reference: record.reference,
      timezone: record.timezone || '',
      age: record.age || undefined,
      tags: record.tags.filter(isUserTag),
      created: new Date(record.created),
      updated: new Date(record.updated),
      orgs: 'orgs' in record ? record.orgs || [] : [],
      parents: 'parents' in record ? record.parents || [] : [],
      roles: 'roles' in record ? record.roles || [] : [],
    });
  }

  public toJSON(): UserJSON {
    const { availability, verifications, ...rest } = this;
    return definedVals({
      ...rest,
      ...super.toJSON(),
      availability: availability.toJSON(),
      verifications: verifications.map((v) => v.toJSON()),
      token: undefined,
      hash: undefined,
    });
  }

  public static fromJSON({
    availability,
    verifications = [],
    ...rest
  }: UserJSON): User {
    return new User({
      ...rest,
      ...Account.fromJSON(rest),
      availability: Availability.fromJSON(availability),
      verifications: verifications.map((v) => Verification.fromJSON(v)),
    });
  }

  // TODO: Replace the language codes with their actual i18n names.
  public toCSV(): Record<string, string> {
    return {
      'User ID': this.id,
      'User Name': this.name,
      'User Email': this.email,
      'User Phone': this.phone,
      'User Bio': this.bio,
      'User Reference': this.reference,
      'User Languages': join(this.langs),
      'User Tags': join(this.tags),
      Subjects: join(this.subjects),
      'Profile Image URL': this.photo,
      'Banner Image URL': this.background,
      'Website URL': this.website,
      'LinkedIn URL': this.linkedin,
      'Twitter URL': this.twitter,
      'Facebook URL': this.facebook,
      'Instagram URL': this.instagram,
      'GitHub URL': this.github,
      'IndieHackers URL': this.indiehackers,
      'User Created': this.created.toString(),
      'User Last Updated': this.updated.toString(),
    };
  }
}
