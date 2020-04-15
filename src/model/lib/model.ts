/**
 * A user object (that is stored in their Firestore profile document by uID).
 * @typedef {Object} UserInterface
 * @property name - The user's name (e.g. their Google `displayName`).
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
  schedule: ScheduleAlias;
  availability?: ScheduleAlias;
  subjects: SubjectsInterface;
  searches: SubjectsInterface;
  parent?: string[];
  notifications: NotificationsConfigInterface;
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
 * @typedef {Object} NotificationsConfigInterface
 * @property email - An array of emails to send email notifications to.
 * @property sms - An array of phone numbers to send SMS text messages to.
 * @property webpush - An array of webpush notification tokens (where we send
 * webpush notifications to).
 * @todo Support different phone #s, emails, etc. for different
 * `NotificationReason`'s (e.g. send a text message to my Mom's phone if a
 * lesson is canceled).
 */
export interface NotificationsConfigInterface {
  [notificationTarget: NotificationTargetAlias]: string[];
  [notificationReason: NotificationReasonAlias]: NotificationTargetAlias[];
}

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
 * One's schedule contains all your booked timeslots (the inverse of one's
 * availability).
 */
export type ScheduleAlias = TimeslotInterface[];

/**
 * One's availability contains all your open timeslots (the inverse of one's
 * schedule).
 */
export type AvailabilityAlias = TimeslotInterface[];

/**
 * Interface that represents an availability time opening or slot. Note that
 * right now, we just assume that these are recurring weekly.
 */
export interface TimeslotInterface {
  from: Date;
  to: Date;
  recurrance?: 'monthly' | 'weekly' | 'daily';
}

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
}
