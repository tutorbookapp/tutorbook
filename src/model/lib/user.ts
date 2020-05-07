import { ObjectWithObjectID } from '@algolia/client-search';
import { Availability, AvailabilityJSONAlias } from './times';
import * as admin from 'firebase-admin';
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import phone from 'phone';
import url from 'url';

/**
 * Type aliases so that we don't have to type out the whole type. We could try
 * importing these directly from the `@firebase/firestore-types` or the
 * `@google-cloud/firestore` packages, but that's not recommended.
 * @todo Perhaps figure out a way to **only** import the type defs we need.
 */
type DocumentData = firebase.firestore.DocumentData;
type DocumentSnapshot = firebase.firestore.DocumentSnapshot;
type DocumentReference = firebase.firestore.DocumentReference;
type SnapshotOptions = firebase.firestore.SnapshotOptions;
type AdminDocumentSnapshot = admin.firestore.DocumentSnapshot;
type AdminDocumentReference = admin.firestore.DocumentReference;

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
 * - A verified social media account (i.e. LinkedIn, GitHub, FB, Insta)
 * - A personal website (mostly just an easy way to link to a resume site)
 *
 * These "verifications" are then shown directly beneath the user's name in the
 * `UserDialog` making it easy for students (and/or their parents) to view and
 * feel assured about a potential tutor's qualifications.
 */
export type VerificationTypeAlias =
  | 'background-check'
  | 'dbs'
  | 'academic-email'
  | 'linkedin'
  | 'github'
  | 'facebook'
  | 'instagram'
  | 'website';

interface VerificationInterface {
  type: VerificationTypeAlias;
  url?: string;
}

/**
 * A user object (that is stored in their Firestore profile document by uID).
 * @typedef {Object} UserInterface
 * @property name - The user's name (e.g. their Google `displayName`).
 * @property bio - A short bio describing the user's education, experience,
 * interests, hobbies, etc (i.e. the concatenation of any miscellaneous form
 * questions like 'Do you have experience tutoring professionally?').
 * @property schedule - An array of `Timeslot`'s when the user is booked.
 * @property availability - An array of `Timeslot`'s when the user is free.
 * @property subjects - The subjects that the user can tutor in.
 * @property searches - The subjects that the user needs tutoring for.
 * @property parents - The Firebase uIDs of linked parent accounts.
 * @property notifications - The user's notification configuration.
 * @property ref - The user's Firestore profile `DocumentReference`.
 * @property token - The user's Firebase Authentication JWT `idToken`.
 * @property verifications - An array of the user's verifications (e.g. Do they
 * have a background check on file? Do they have an academic email address?).
 */
export interface UserInterface {
  uid?: string;
  name: string;
  email?: string;
  phone?: string;
  photo?: string;
  grade?: GradeAlias;
  bio?: string;
  schedule: Availability;
  availability: Availability;
  subjects: SubjectsInterface;
  searches: SubjectsInterface;
  parents?: string[];
  notifications: NotificationsConfigAlias;
  ref?: DocumentReference | AdminDocumentReference;
  token?: string;
  verifications: VerificationInterface[];
}

/**
 * Note that the `notifications` property is optional in this JSON
 * representation of a `User` because it needs to be able to represent a search
 * result object that only contains:
 * - User's first name and last initial
 * - User's bio (e.g. their education and experience)
 * - User's availability (for tutoring)
 * - User's subjects (what they can tutor)
 * - User's searches (what they need tutoring for)
 * - User's Firebase Authentication uID (as the Algolia `objectID`)
 * @todo Update the above doc comment.
 */
export interface UserJSONInterface {
  uid?: string;
  name: string;
  email?: string;
  phone?: string;
  photo?: string;
  grade?: GradeAlias;
  bio?: string;
  schedule: AvailabilityJSONAlias;
  availability: AvailabilityJSONAlias;
  subjects: SubjectsInterface;
  searches: SubjectsInterface;
  parents?: string[];
  notifications?: NotificationsConfigAlias;
  token?: string;
  verifications: VerificationInterface[];
}

/**
 * What results from searching our users Algolia index.
 * @todo Perhaps we don't want to have duplicate fields (i.e. the `objectID`
 * field is **always** going to be equal to the `uid` field).
 */
export type UserSearchHitAlias = UserJSONInterface & ObjectWithObjectID;

/**
 * Class that provides default values for our `UserInterface` data model.
 * @todo Implement useful helper methods here and replace all instances of
 * `UserInterface` with `User` throughout the web app.
 * @see {@link https://stackoverflow.com/a/54857125/10023158}
 */
export class User implements UserInterface {
  public uid: string = '';
  public name: string = '';
  public email: string = '';
  public phone: string = '';
  public photo: string = '';
  public bio: string = '';
  public schedule: Availability = new Availability();
  public availability: Availability = new Availability();
  public subjects: SubjectsInterface = {
    explicit: [],
    implicit: [],
    filled: [],
  };
  public searches: SubjectsInterface = {
    explicit: [],
    implicit: [],
    filled: [],
  };
  public parents: string[] = [];
  public notifications: NotificationsConfigAlias = {
    email: [],
    sms: [],
    webpush: [],
    newRequest: ['email', 'webpush'],
    newLesson: ['sms', 'email', 'webpush'],
  };
  public ref?: DocumentReference | AdminDocumentReference;
  public token?: string;
  public grade?: GradeAlias;
  public verifications: VerificationInterface[] = [];

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
    Object.entries(user).map(([key, val]: [string, any]) => {
      if (val && key in this) (this as Record<string, any>)[key] = val;
    });
    if (this.phone) this.phone = phone(this.phone)[0] || '';
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
  public toIntercom(): Record<string, any> {
    const { uid, photo, ...rest } = this;
    return {
      user_id: uid,
      avatar: {
        type: 'avatar',
        image_url: photo,
      },
      ...rest,
    };
  }

  public static fromSearchHit(hit: UserSearchHitAlias): User {
    const { schedule, availability, objectID, ...rest } = hit;
    const user: Partial<UserInterface> = {
      ...rest,
      schedule: Availability.fromJSON(schedule),
      availability: Availability.fromJSON(availability),
      uid: objectID,
    };
    return new User(user);
  }

  public static fromFirestore(
    snapshot: DocumentSnapshot | AdminDocumentSnapshot,
    options?: SnapshotOptions
  ): User {
    const userData: DocumentData | undefined = snapshot.data(options);
    if (userData) {
      const { availability, schedule, ...rest } = userData;
      return new User({
        ...rest,
        schedule: Availability.fromFirestore(schedule),
        availability: Availability.fromFirestore(availability),
        ref: snapshot.ref,
        uid: snapshot.id,
      });
    } else {
      console.warn(
        `[WARNING] Tried to create user (${snapshot.ref.id}) from ` +
          'non-existent Firestore document.'
      );
      return new User();
    }
  }

  /**
   * Converts a `User` object into a JSON-like format for adding to a
   * Firestore document.
   * @see {@link https://firebase.google.com/docs/firestore/manage-data/add-data#custom_objects}
   * @see {@link https://firebase.google.com/docs/reference/js/firebase.firestore.FirestoreDataConverter}
   */
  public toFirestore(): DocumentData {
    const { schedule, availability, token, ref, ...rest } = this;
    const allDefinedValues = Object.fromEntries(
      Object.entries(rest).filter(([key, val]) => val !== undefined)
    );
    return {
      ...allDefinedValues,
      schedule: schedule.toFirestore(),
      availability: availability.toFirestore(),
    };
  }

  public static fromJSON(json: UserJSONInterface): User {
    const { schedule, availability, ...rest } = json;
    return new User({
      ...rest,
      schedule: Availability.fromJSON(schedule),
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
  public toJSON(): UserJSONInterface {
    const { schedule, availability, ref, ...rest } = this;
    return {
      ...rest,
      schedule: schedule.toJSON(),
      availability: availability.toJSON(),
    };
  }

  /**
   * Gets the search URL where the URL parameters are determined by this user's
   * `searches.explicit` and `availability` fields.
   *
   * @todo Ensure this works on the server-side (i.e. when it doesn't know what
   * hostname or protocol to use).
   */
  public get searchURL(): string {
    return url.format({
      pathname: '/search',
      query: {
        subjects: encodeURIComponent(JSON.stringify(this.searches.explicit)),
        availability: this.availability.toURLParam(),
      },
    });
  }
}

/**
 * A configuration object that denotes where to send notifications and for what
 * reasons.
 * @example
 * {
 *  email: ['nicholas.h.chiang@gmail.com'], // Send emails to this address.
 *  sms: ['+16508543726', '+18003758900'], // Send SMS to these two phone #s.
 *  webpush: [], // User hasn't enabled webpush notifications... yet.
 *  newRequest: ['email', 'sms', 'webpush'], // Send it all for new requests.
 *  newLesson: ['sms', 'webpush'], // Send webpush and SMS for new lessons.
 *  canceledLesson: [], // Don't send any notifications for canceled lessons.
 * }
 * @typedef {Object} NotificationsConfigAlias
 * @property email - An array of emails to send email notifications to.
 * @property sms - An array of phone numbers to send SMS text messages to.
 * @property webpush - An array of webpush notification tokens (where we send
 * webpush notifications to).
 * @todo Support different phone #s, emails, etc. for different
 * `NotificationReason`'s (e.g. send a text message to my Mom's phone if a
 * lesson is canceled).
 * @todo Why do we have to use an intersection type for this? Why can't we just
 * put both mapped types in the same alias definition? And shouldn't we be using
 * an `interface` for this?
 * @see {@link https://www.typescriptlang.org/docs/handbook/advanced-types.html#mapped-types}
 */
export type NotificationsConfigAlias = {
  [TargetString in NotificationTargetAlias]: string[];
} &
  { [ReasonString in NotificationReasonAlias]: NotificationTargetAlias[] };

/**
 * Current ways we send notifications (e.g. via email, through text messages,
 * through PWA webpush notifications).
 */
export type NotificationTargetAlias = 'email' | 'sms' | 'webpush';

/**
 * All the different reasons why we'd send you a notification (e.g. `newRequest`
 * for whenever anyone sends you a new lesson request).
 */
export type NotificationReasonAlias = 'newRequest' | 'newLesson';

/**
 * A user's subjects (i.e. subjects they can tutor for or need tutoring in).
 * @typedef {Object} SubjectsInterface
 * @property {string[]} implicit - The implied subjects (e.g. subjects that had
 * been searched for in the past).
 * @property {string[]} explicit - The user-denoted subjects (e.g. the subjects
 * that the pupil enters when they first sign-up).
 */
export interface SubjectsInterface {
  implicit: string[];
  explicit: string[];
  filled: string[];
}
