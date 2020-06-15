import * as admin from 'firebase-admin';

import firebase from '@tutorbook/firebase';
import url from 'url';

import { ObjectWithObjectID } from '@algolia/client-search';
import {
  Availability,
  AvailabilitySearchHitAlias,
  AvailabilityJSONAlias,
} from './times';
import { Account, AccountInterface } from './account';
import { RoleAlias } from './appt';
import { Aspect } from './query';

/**
 * Type aliases so that we don't have to type out the whole type. We could try
 * importing these directly from the `@firebase/firestore-types` or the
 * `@google-cloud/firestore` packages, but that's not recommended.
 * @todo Perhaps figure out a way to **only** import the type defs we need.
 */
type DocumentData = firebase.firestore.DocumentData;
type DocumentSnapshot = firebase.firestore.DocumentSnapshot;
type SnapshotOptions = firebase.firestore.SnapshotOptions;
type AdminDocumentSnapshot = admin.firestore.DocumentSnapshot;

/**
 * Duplicate definition from the `@tutorbook/react-intercom` package. These are
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
 * Represents a user verification to provide social proof. Supported types are:
 * - A background check or UK DBS on file
 * - A verified academic email address (e.g. `ac.uk` or `stanford.edu`)
 * - A verified social media account (i.e. LinkedIn, Twitter, FB, Insta)
 * - A personal website (mostly just an easy way to link to a resume site)
 *
 * These "socials" are then shown directly beneath the user's name in the
 * `UserDialog` making it easy for students (and/or their parents) to view and
 * feel assured about a potential tutor's qualifications.
 */
export type SocialTypeAlias =
  | 'website'
  | 'linkedin'
  | 'twitter'
  | 'facebook'
  | 'instagram'
  | 'github'
  | 'indiehackers';

export interface SocialInterface {
  type: SocialTypeAlias;
  url: string;
}

/**
 * A user object (that is stored in their Firestore profile document by uID).
 * @typedef {Object} UserInterface
 * @property orgs - An array of the IDs of the orgs this user belongs to.
 * @property availability - An array of `Timeslot`'s when the user is free.
 * @property mentoring - The subjects that the user wants a and can mentor for.
 * @property tutoring - The subjects that the user wants a and can tutor for.
 * @property langs - The languages (as ISO codes) the user can speak fluently.
 * @property parents - The Firebase uIDs of linked parent accounts.
 * @property socials - An array of the user's socials (e.g. LinkedIn, Facebook).
 * @property token - The user's Firebase Authentication JWT `idToken`.
 */
export interface UserInterface extends AccountInterface {
  orgs: string[];
  availability: Availability;
  mentoring: { subjects: string[]; searches: string[] };
  tutoring: { subjects: string[]; searches: string[] };
  langs: string[];
  parents: string[];
  socials: SocialInterface[];
  token?: string;
}

export interface SearchResult {
  id: string;
  name: string;
  photo: string;
  bio: string;
  availability: AvailabilityJSONAlias;
  mentoring: { subjects: string[]; searches: string[] };
  tutoring: { subjects: string[]; searches: string[] };
  langs: string[];
  socials: SocialInterface[];
}

export type UserWithRoles = User & { roles: RoleAlias[] };

export type UserJSON = Omit<UserInterface, 'availability'> & {
  availability: AvailabilityJSONAlias;
};

export function isUserJSON(json: any): json is UserJSON {
  return (json as UserJSON).availability !== undefined;
}

/**
 * What results from searching our users Algolia index.
 * @todo Perhaps we don't want to have duplicate fields (i.e. the `objectID`
 * field is **always** going to be equal to the `uid` field).
 */
export type UserSearchHitAlias = Omit<
  UserJSON,
  'orgs' | 'parents' | 'email' | 'phone' | 'id' | 'availability'
> & { availability: AvailabilitySearchHitAlias } & {
  featured?: Aspect[];
} & ObjectWithObjectID;

/**
 * Class that provides default values for our `UserInterface` data model.
 * @see {@link https://stackoverflow.com/a/54857125/10023158}
 */
export class User extends Account implements UserInterface {
  public orgs: string[] = [];

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

  public socials: SocialInterface[] = [];

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
    Object.entries(user).forEach(([key, val]: [string, any]) => {
      /* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */
      if (val && key in this && !(key in new Account()))
        (this as Record<string, any>)[key] = val;
    });
    this.socials = this.socials.filter((s: SocialInterface) => !!s.url);
  }

  public get firstName(): string {
    return this.name.split(' ')[0];
  }

  public get lastName(): string {
    const parts: string[] = this.name.split(' ');
    return parts[parts.length - 1];
  }

  public toString(): string {
    return `${this.name} (${this.id})`;
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
        .filter(([key, val]) => isFilled(val))
        .map(([key, val]) => [key, isValid(val) ? val : JSON.stringify(val)])
    );
    return { ...intercomValues, ...super.toIntercom() };
  }

  public static fromSearchHit(hit: UserSearchHitAlias): User {
    const { availability, objectID, ...rest } = hit;
    const user: Partial<UserInterface> = {
      ...rest,
      availability: Availability.fromJSON(availability),
      id: objectID,
    };
    return new User(user);
  }

  public static fromFirestore(
    snapshot: DocumentSnapshot | AdminDocumentSnapshot,
    options?: SnapshotOptions
  ): User {
    const userData: DocumentData | undefined = snapshot.data(options);
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
    const { availability, token, ref, ...rest } = this;
    const allDefinedValues = Object.fromEntries(
      Object.entries(rest).filter(([key, val]) => val !== undefined)
    );
    const allFilledValues = Object.fromEntries(
      Object.entries(allDefinedValues).filter(([key, val]) => {
        if (!val) return false;
        if (typeof val === 'object' && !Object.keys(val).length) return false;
        return true;
      })
    );
    return {
      ...allFilledValues,
      availability: availability.toFirestore(),
    };
  }

  public static fromJSON(json: UserJSON): User {
    const { availability, ...rest } = json;
    return new User({
      ...rest,
      availability: Availability.fromJSON(availability),
    });
  }

  /**
   * Note that right now, we're sending the `token` property along with a user
   * JSON object in the `/api/user` REST API endpoint. But that's the **only
   * case** where we'd ever want to serialize and send a Firebase Auth JWT.
   * @todo Perhaps remove the `token` from the JSON object and add it manually
   * in the `/api/user` REST API endpoint.
   */
  public toJSON(): UserJSON {
    const { availability, ref, ...rest } = this;
    return {
      ...rest,
      availability: availability.toJSON(),
    };
  }

  /**
   * Gets the search URL where the URL parameters are determined by this user's
   * `searches` and `availability` fields.
   *
   * @todo Ensure this works on the server-side (i.e. when it doesn't know what
   * hostname or protocol to use).
   */
  public get searchURL(): string {
    return url.format({
      pathname: '/search',
      query: {
        subjects: encodeURIComponent(JSON.stringify(this.tutoring.searches)),
        availability: this.availability.toURLParam(),
      },
    });
  }
}
