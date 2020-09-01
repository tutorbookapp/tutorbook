import * as admin from 'firebase-admin';
import { ObjectWithObjectID } from '@algolia/client-search';

import {
  Availability,
  AvailabilityJSON,
  AvailabilitySearchHit,
} from './availability';
import { Account, AccountInterface } from './account';
import { Resource } from './resource';
import construct from './construct';

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

/**
 * A check is a single aspect of a verification.
 * @example
 * - A verified university email address (e.g. `@stanford.edu`).
 * - A verified normal email address.
 * - A verified social (@see {@link SocialTypeAlias}) account (e.g. LinkedIn).
 * - A DBS check on file.
 */
export type Check =
  | 'email'
  | 'background-check'
  | 'academic-email'
  | 'training'
  | 'interview';

/**
 * Various tags that are added to the Algolia users search during indexing (via
 * the `firebase/functions/src/algolia.ts` GCP serverless function).
 */
export type Tag = 'not-vetted';

/**
 * A verification is run by a non-profit organization (the `org`) by a member of
 * that organization (the `user`). The non-profit takes full responsibility for
 * their verification and liability for the user's actions.
 * @typedef {Object} Verification
 * @extends Resource
 * @property user - The uID of the user who ran the verification.
 * @property org - The id of the non-profit org that the `user` belongs to.
 * @property notes - Any notes about the verification (e.g. what happened).
 * @property checks - An array of checks (@see {@link Check}) passed.
 */
export interface Verification extends Resource {
  user: string;
  org: string;
  notes: string;
  checks: Check[];
}

/**
 * A user's Zoom account that belongs to a certain org.
 * @typedef {Object} ZoomUser
 * @extends Resource
 * @property id - The Zoom-assigned user ID.
 * @property email - The email address used with the Zoom user account.
 * @property org - The ID of the TB org under which this Zoom user belongs.
 */
export interface ZoomUser extends Resource {
  id: string;
  email: string;
  org: string;
}

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
  token?: string;
}

/**
 * What results from searching our users Algolia index.
 */
export type UserSearchHit = ObjectWithObjectID &
  Omit<UserInterface, 'availability'> & {
    availability: AvailabilitySearchHit;
  };

export type UserJSON = Omit<UserInterface, 'availability'> & {
  availability: AvailabilityJSON;
};

export function isUserJSON(json: any): json is UserJSON {
  return (json as UserJSON).availability !== undefined;
}

/**
 * Class that provides default values for our `UserInterface` data model.
 * @see {@link https://stackoverflow.com/a/54857125/10023158}
 */
export class User extends Account implements UserInterface {
  public orgs: string[] = ['default'];

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
   * @see {@link https://developers.intercom.com/installing-intercom/docs/javascript-api-attributes-objects#section-data-attributes}
   */
  public toIntercom(): Record<string, IntercomCustomAttribute> {
    const { id, photo, token, ref, ...rest } = this;
    const isFilled: (val: any) => boolean = (val: any) => {
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
          return Object.values(val).filter(isFilled).length > 0;
        default:
          return !!val;
      }
    };
    const isValid: (val: any) => boolean = (val: any) => {
      if (typeof val === 'string') return true;
      if (typeof val === 'boolean') return true;
      if (typeof val === 'number') return true;
      if (val instanceof Date) return true;
      return false;
    };
    const intercomValues: Record<string, any> = Object.fromEntries(
      Object.entries(rest)
        .filter(([_, val]) => isFilled(val))
        .map(([key, val]) => [key, isValid(val) ? val : JSON.stringify(val)])
    );
    return { ...intercomValues, ...super.toIntercom() };
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
      const { availability, ...rest } = userData;
      return new User({
        ...rest,
        availability: Availability.fromFirestore(availability),
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

  /**
   * Converts a `User` object into a JSON-like format for adding to a
   * Firestore document.
   * @see {@link https://firebase.google.com/docs/firestore/manage-data/add-data#custom_objects}
   * @see {@link https://firebase.google.com/docs/reference/js/firebase.firestore.FirestoreDataConverter}
   */
  public toFirestore(): DocumentData {
    const base = super.toFirestore();
    delete base.token;
    return { ...base, availability: this.availability.toFirestore() };
  }

  public static fromJSON(json: UserJSON): User {
    const { availability, ...rest } = json;
    return new User({
      ...rest,
      availability: Availability.fromJSON(availability),
    });
  }

  public toJSON(): UserJSON {
    const { availability, ref, token, ...rest } = this;
    return { ...rest, availability: availability.toJSON() };
  }
}
