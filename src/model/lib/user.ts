import {
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  SnapshotOptions,
} from '@firebase/firestore-types';
import { Availability } from './times';

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
 * @property parent - The Firebase uIDs of linked parent accounts.
 * @property notifications - The user's notification configuration.
 */
export interface UserInterface {
  name: string;
  email?: string;
  phone?: string;
  bio?: string;
  schedule: Availability;
  availability: Availability;
  subjects: SubjectsInterface;
  searches: SubjectsInterface;
  parent?: string[];
  notifications: NotificationsConfigAlias;
}

/**
 * Class that provides default values for our `UserInterface` data model.
 * @todo Implement useful helper methods here and replace all instances of
 * `UserInterface` with `User` throughout the web app.
 * @see {@link https://stackoverflow.com/a/54857125/10023158}
 */
export class User implements UserInterface {
  public name: string = '';
  public email: string = '';
  public phone: string = '';
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
  public parent?: string[] = [];
  public notifications: NotificationsConfigAlias = {
    email: [],
    sms: [],
    webpush: [],
    newRequest: ['email', 'webpush'],
    newLesson: ['sms', 'email', 'webpush'],
  };

  /**
   * Creates a new `User` object by overriding all of our default values w/ the
   * values contained in the given `UserInterface` object.
   */
  public constructor(user: Partial<UserInterface>) {
    Object.entries(user).map(([key, val]: [string, any]) => {
      if (!val) delete (user as any)[key];
    });
    Object.assign(this, user);
  }

  public static fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options?: SnapshotOptions
  ): User {
    return new User(snapshot.data(options));
  }

  /**
   * Converts a `User` object into a JSON-like format for adding to a
   * Firestore document.
   * @see {@link https://firebase.google.com/docs/firestore/manage-data/add-data#custom_objects}
   * @see {@link https://firebase.google.com/docs/reference/js/firebase.firestore.FirestoreDataConverter}
   */
  public toFirestore(): DocumentData {
    const { schedule, availability, ...rest } = this;
    return {
      ...rest,
      schedule: schedule.toFirestore(),
      availability: availability.toFirestore(),
    };
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
