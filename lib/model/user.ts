import * as admin from 'firebase-admin';
import { ObjectWithObjectID } from '@algolia/client-search';

import { Account, AccountInterface, isAccountJSON } from 'lib/model/account';
import { Aspect, isAspect } from 'lib/model/aspect';
import {
  Availability,
  AvailabilityJSON,
  AvailabilitySearchHit,
  isAvailabilityJSON,
} from 'lib/model/availability';
import {
  Verification,
  VerificationJSON,
  isVerificationJSON,
  verificationsFromFirestore,
} from 'lib/model/verification';
import {
  ZoomUser,
  ZoomUserJSON,
  isZoomUserJSON,
  zoomsFromFirestore,
} from 'lib/model/zoom-user';
import { isArray, isJSON, isStringArray } from 'lib/model/json';
import construct from 'lib/model/construct';
import firestoreVals from 'lib/model/firestore-vals';

type DocumentData = admin.firestore.DocumentData;
type DocumentSnapshot = admin.firestore.DocumentSnapshot;

/**
 * Duplicate definition from the `lib/react-intercom` package. These are
 * all the valid datatypes for custom Intercom user attributes.
 * @see {@link https://www.intercom.com/help/en/articles/179-send-custom-user-attributes-to-intercom}
 */
type IntercomCustomAttribute = string | boolean | number | Date;

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
 * Various tags that are added to the Algolia users search during indexing (via
 * the `firebase/functions/src/algolia.ts` GCP serverless function).
 */
export type Tag = 'not-vetted';

/**
 * A user object (that is stored in their Firestore profile document by uID).
 * @typedef {Object} UserInterface
 * @extends AccountInterface
 * @property orgs - An array of the IDs of the orgs this user belongs to.
 * @property zooms - An array of Zoom user accounts. These are used when
 * creating Zoom meetings for a match. Each TB user can have multiple Zoom user
 * accounts managed by different orgs; we use the Zoom account belonging to the
 * org that owns the match when creating Zoom meetings for said match.
 * @property availability - An array of `Timeslot`'s when the user is free.
 * @property mentoring - The subjects that the user wants a and can mentor for.
 * @property tutoring - The subjects that the user wants a and can tutor for.
 * @property langs - The languages (as ISO codes) the user can speak fluently.
 * @property parents - The Firebase uIDs of linked parent accounts.
 * @property visible - Whether or not this user appears in search results.
 * @property featured - Aspects in which this user is first in search results.
 * @property token - The user's Firebase Authentication JWT `idToken`.
 * @todo Add a `zoom` prop that contains the user's personal Zoom OAuth token
 * (e.g. for freelancers who want to user their own Zoom account when creating
 * meetings).
 */
export interface UserInterface extends AccountInterface {
  orgs: string[];
  zooms: ZoomUser[];
  availability: Availability;
  mentoring: { subjects: string[]; searches: string[] };
  tutoring: { subjects: string[]; searches: string[] };
  langs: string[];
  parents: string[];
  verifications: Verification[];
  visible: boolean;
  featured: Aspect[];
  token?: string;
}

/**
 * What results from searching our users Algolia index.
 */
export type UserSearchHit = ObjectWithObjectID &
  Omit<UserInterface, 'availability'> & {
    availability: AvailabilitySearchHit;
  };

export type UserJSON = Omit<
  UserInterface,
  'availability' | 'verifications' | 'zooms'
> & {
  availability: AvailabilityJSON;
  verifications: VerificationJSON[];
  zooms: ZoomUserJSON[];
};

export function isUserJSON(json: unknown): json is UserJSON {
  if (!isAccountJSON(json)) return false;
  if (!isJSON(json)) return false;
  if (!isStringArray(json.orgs)) return false;
  if (!(json.zooms instanceof Array)) return false;
  if (json.zooms.some((zoom) => !isZoomUserJSON(zoom))) return false;
  if (!isAvailabilityJSON(json.availability)) return false;
  if (!isSubjects(json.mentoring)) return false;
  if (!isSubjects(json.tutoring)) return false;
  if (!isStringArray(json.langs)) return false;
  if (!isStringArray(json.parents)) return false;
  if (!isArray(json.verifications, isVerificationJSON)) return false;
  if (typeof json.visible !== 'boolean') return false;
  if (!isArray(json.featured, isAspect)) return false;
  if (json.token && typeof json.token !== 'string') return false;
  return true;
}

/**
 * Class that provides default values for our `UserInterface` data model.
 * @see {@link https://stackoverflow.com/a/54857125/10023158}
 */
export class User extends Account implements UserInterface {
  public orgs: string[] = [];

  public zooms: ZoomUser[] = [];

  public availability: Availability = new Availability();

  public mentoring: { subjects: string[]; searches: string[] } = {
    subjects: [],
    searches: [],
  };

  public tutoring: { subjects: string[]; searches: string[] } = {
    subjects: [],
    searches: [],
  };

  public langs: string[] = [];

  public parents: string[] = [];

  public verifications: Verification[] = [];

  public visible = false;

  public featured: Aspect[] = [];

  public token?: string;

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

  public get firstName(): string {
    return this.name.split(' ')[0];
  }

  public get lastName(): string {
    const parts: string[] = this.name.split(' ');
    return parts[parts.length - 1];
  }

  /**
   * Converts this `User` object into a `Record<string, any>` that Intercom can
   * understand.
   * @see {@link https://bit.ly/3ksWc8B}
   */
  public toIntercom(): Record<string, IntercomCustomAttribute> {
    const { id, photo, token, ref, ...rest } = this;
    const isFilled = (val: unknown): boolean => {
      switch (typeof val) {
        case 'string':
          return val !== '';
        case 'boolean':
          return true;
        case 'number':
          return true;
        case 'undefined':
          return false;
        case 'object':
          if (val === null) return false;
          return Object.values(val).filter(isFilled).length > 0;
        default:
          return !!val;
      }
    };
    const isValid = (val: unknown): boolean => {
      if (typeof val === 'string') return true;
      if (typeof val === 'boolean') return true;
      if (typeof val === 'number') return true;
      if (val instanceof Date) return true;
      return false;
    };
    return Object.fromEntries(
      Object.entries(rest)
        .filter(([_, val]) => isFilled(val))
        .map(([key, val]) => [key, isValid(val) ? val : JSON.stringify(val)])
    );
  }

  public static fromSearchHit(hit: UserSearchHit): User {
    const { availability, objectID, ...rest } = hit;
    const user: Partial<UserInterface> = {
      ...rest,
      availability: Availability.fromSearchHit(availability),
      id: objectID,
    };
    return new User(user);
  }

  public static fromFirestore(snapshot: DocumentSnapshot): User {
    const userData: DocumentData | undefined = snapshot.data();
    if (userData) {
      const { availability, verifications, zooms, ...rest } = userData;
      return new User({
        ...rest,
        availability: Availability.fromFirestore(availability),
        verifications: verificationsFromFirestore(verifications),
        zooms: zoomsFromFirestore(zooms),
        ref: snapshot.ref,
        id: snapshot.id,
      });
    }
    console.warn(
      `[WARNING] Tried to create user (${snapshot.ref.id}) from ` +
        'non-existent Firestore document.'
    );
    return new User();
  }

  public toFirestore(): DocumentData {
    return firestoreVals({
      ...super.toFirestore(),
      availability: this.availability.toFirestore(),
      token: undefined,
    });
  }

  public static fromJSON(json: UserJSON): User {
    const { availability, verifications, zooms, ...rest } = json;
    return new User({
      ...rest,
      availability: Availability.fromJSON(availability),
      verifications: verifications.map((v) => Verification.fromJSON(v)),
      zooms: zooms.map((z) => ZoomUser.fromJSON(z)),
    });
  }

  public toJSON(): UserJSON {
    const { availability, verifications, zooms, ref, token, ...rest } = this;
    return {
      ...rest,
      availability: availability.toJSON(),
      verifications: verifications.map((v) => v.toJSON()),
      zooms: zooms.map((z) => z.toJSON()),
    };
  }
}
