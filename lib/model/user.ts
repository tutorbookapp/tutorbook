import * as admin from 'firebase-admin';

import {
  Account,
  AccountFirestore,
  AccountInterface,
  AccountJSON,
  isAccountJSON,
} from 'lib/model/account';
import { Aspect, isAspect } from 'lib/model/aspect';
import {
  Availability,
  AvailabilityFirestore,
  AvailabilityJSON,
  isAvailabilityJSON,
} from 'lib/model/availability';
import { DBDate, DBTimeslot } from 'lib/model/timeslot';
import { Person, Role, isRole } from 'lib/model/person';
import {
  Verification,
  VerificationFirestore,
  VerificationJSON,
  isVerificationJSON,
} from 'lib/model/verification';
import { caps, join, notTags } from 'lib/utils';
import { isArray, isJSON, isStringArray } from 'lib/model/json';
import clone from 'lib/utils/clone';
import construct from 'lib/model/construct';
import definedVals from 'lib/model/defined-vals';

type DocumentSnapshot = admin.firestore.DocumentSnapshot;

/**
 * Various tags that are added to the Algolia users search during indexing (via
 * the `lib/api/algolia.ts` API back-end module). For in-depth explanations of
 * each one, reference the link included below.
 * @see {@link https://github.com/tutorbookapp/tutorbook/tree/TAGS.md}
 */
export type UserTag =
  | 'vetted' // Has at least one verification.
  | 'matched' // In at least one match.
  | 'meeting' // Has at least one meeting.
  | Role; // Has this role in at least one match.

export type UserHitTag =
  | UserTag
  | 'not-tutor'
  | 'not-tutee'
  | 'not-mentor'
  | 'not-mentee'
  | 'not-parent'
  | 'not-vetted'
  | 'not-matched'
  | 'not-meeting';

export const USER_TAGS: UserTag[] = [
  'tutor',
  'tutee',
  'mentor',
  'mentee',
  'parent',
  'vetted',
  'matched',
  'meeting',
];

export function isUserTag(tag: unknown): tag is UserTag {
  if (typeof tag !== 'string') return false;
  return ['vetted', 'matched', 'meeting'].includes(tag) || isRole(tag);
}

/**
 * Right now, we only support traditional K-12 grade levels (e.g. 'Freshman'
 * maps to the number 9).
 * @todo Perhaps support other grade levels and other educational systems (e.g.
 * research how other countries do grade levels).
 */
export type GradeAlias = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export type Subjects = { subjects: string[]; searches: string[] };

export function isSubjects(json: unknown): json is Subjects {
  if (!isJSON(json)) return false;
  if (!isStringArray(json.subjects)) return false;
  if (!isStringArray(json.searches)) return false;
  return true;
}

/**
 * A user object (that is stored in their Firestore profile document by uID).
 * @typedef {Object} UserInterface
 * @extends AccountInterface
 * @property [age] - The user's age (mostly used for students).
 * @property orgs - An array of the IDs of the orgs this user belongs to.
 * @property availability - An array of `Timeslot`'s when the user is free.
 * @property mentoring - The subjects that the user wants a and can mentor for.
 * @property tutoring - The subjects that the user wants a and can tutor for.
 * @property langs - The languages (as ISO codes) the user can speak fluently.
 * @property parents - The Firebase uIDs of linked parent accounts.
 * @property visible - Whether or not this user appears in search results.
 * @property featured - Aspects in which this user is first in search results.
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
  mentoring: Subjects;
  tutoring: Subjects;
  langs: string[];
  parents: string[];
  verifications: Verification[];
  visible: boolean;
  featured: Aspect[];
  roles: Role[];
  tags: UserTag[];
  reference: string;
  timezone: string;
  token?: string;
  hash?: string;
}

export type DBAspect = 'mentoring' | 'tutoring';
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
  mentoring: string[];
  tutoring: string[];
  langs: string[];
  visible: boolean;
  featured: DBAspect[];
  reference: string;
  timezone: string | null;
  age: number | null;
  tags: (
    | 'vetted'
    | 'matched'
    | 'meeting'
    | 'tutor'
    | 'tutee'
    | 'mentor'
    | 'mentee'
    | 'parent'
  )[];
  created: DBDate;
  updated: DBDate;
  times: number[];
}
export interface DBViewUser extends DBUser {
  orgs: string[] | null;
  parents: string[] | null;
  available: boolean;
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

export type UserFirestore = Omit<
  UserInterface,
  keyof Account | 'availability' | 'verifications'
> &
  AccountFirestore & {
    availability: AvailabilityFirestore;
    verifications: VerificationFirestore[];
  };

export function isUserJSON(json: unknown): json is UserJSON {
  if (!isAccountJSON(json)) return false;
  if (!isJSON(json)) return false;
  if (json.age && typeof json.age !== 'number') return false;
  if (!isStringArray(json.orgs)) return false;
  if (!isAvailabilityJSON(json.availability)) return false;
  if (!isSubjects(json.mentoring)) return false;
  if (!isSubjects(json.tutoring)) return false;
  if (!isStringArray(json.langs)) return false;
  if (!isStringArray(json.parents)) return false;
  if (!isArray(json.verifications, isVerificationJSON)) return false;
  if (typeof json.visible !== 'boolean') return false;
  if (!isArray(json.featured, isAspect)) return false;
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

  public mentoring: Subjects = { subjects: [], searches: [] };

  public tutoring: Subjects = { subjects: [], searches: [] };

  public langs: string[] = ['en'];

  public parents: string[] = [];

  public verifications: Verification[] = [];

  public visible = false;

  public featured: Aspect[] = [];

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

  public get subjects(): string[] {
    const subjects = this.tutoring.subjects.concat(this.mentoring.subjects);
    return [...new Set<string>(subjects)];
  }

  public toPerson(): Person {
    return {
      id: this.id,
      name: this.name,
      photo: this.photo,
      roles: this.roles,
    };
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
      mentoring: this.mentoring.subjects,
      tutoring: this.tutoring.subjects,
      langs: this.langs,
      visible: this.visible,
      featured: this.featured,
      reference: this.reference,
      timezone: this.timezone || null,
      age: this.age || null,
      tags: this.tags,
      created: this.created.toISOString(),
      updated: this.updated.toISOString(),
      times: [],
    };
  }

  public static fromDB(record: DBUser | DBViewUser): User {
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
      mentoring: { subjects: record.mentoring, searches: [] },
      tutoring: { subjects: record.tutoring, searches: [] },
      langs: record.langs,
      visible: record.visible,
      featured: record.featured,
      reference: record.reference,
      timezone: record.timezone || '',
      age: record.age || undefined,
      tags: record.tags,
      created: new Date(record.created),
      updated: new Date(record.updated),
      orgs: 'orgs' in record ? record.orgs || [] : [],
      parents: 'parents' in record ? record.parents || [] : [],
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

  public toFirestore(): UserFirestore {
    const { availability, verifications, ...rest } = this;
    return definedVals({
      ...rest,
      ...super.toFirestore(),
      availability: availability.toFirestore(),
      verifications: verifications.map((v) => v.toFirestore()),
      token: undefined,
      hash: undefined,
    });
  }

  public static fromFirestore({
    availability,
    verifications = [],
    ...rest
  }: UserFirestore): User {
    return new User({
      ...rest,
      ...Account.fromFirestore(rest),
      availability: Availability.fromFirestore(availability),
      verifications: verifications.map((v) => Verification.fromFirestore(v)),
    });
  }

  public static fromFirestoreDoc(snapshot: DocumentSnapshot): User {
    if (!snapshot.exists) return new User();
    const overrides = definedVals({
      created: snapshot.createTime?.toDate(),
      updated: snapshot.updateTime?.toDate(),
      id: snapshot.id,
    });
    const user = User.fromFirestore(snapshot.data() as UserFirestore);
    return new User({ ...user, ...overrides });
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
      'Mentoring Subjects': join(this.mentoring.subjects),
      'Tutoring Subjects': join(this.tutoring.subjects),
      'Mentoring Searches': join(this.mentoring.searches),
      'Tutoring Searches': join(this.tutoring.searches),
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
