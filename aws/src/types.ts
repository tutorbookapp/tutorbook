import admin from 'firebase-admin';

export type FirebaseApp = admin.app.App;
export type FirebaseError = admin.FirebaseError & Error;
export type FirebaseAuth = admin.auth.Auth;
export type UserRecord = admin.auth.UserRecord;
export type DocumentSnapshot = admin.firestore.DocumentSnapshot;
export type DocumentReference = admin.firestore.DocumentReference;

export type Role = 'tutor' | 'tutee' | 'mentor' | 'mentee';

export interface Person {
  id: string;
  handle: string;
  roles: Role[];
}

export interface MatchSearchHit {
  objectID: string;
}

export interface Header {
  name: string;
  value: string;
}

export interface Verdict {
  status: 'PASS' | 'GRAY' | 'FAIL';
}

export interface SESNotification {
  mail: {
    timestamp: string;
    source: string;
    messageId: string;
    destination: string[];
    headersTruncated: boolean;
    headers: Header[];
    commonHeaders: {
      returnPath: string;
      from: string[];
      date: string;
      to: string[];
      messageId: string;
      subject: string;
    };
  };
  receipt: {
    timestamp: string;
    processingTimeMillis: number;
    recipients: string[];
    spamVerdict: Verdict;
    virusVerdict: Verdict;
    spfVerdict: Verdict;
    dkimVerdict: Verdict;
    dmarcVerdict: Verdict;
    action: {
      type: 'Lambda';
      functionArn: string;
      invocationType: 'Event' | 'RequestResponse';
    };
  };
}

/**
 * The event that is passed to AWS SES Lambda receipt actions (every time an
 * email is received).
 * @see {@link https://amzn.to/2BQm7WG}
 */
export interface MailEvent {
  Records: [
    {
      eventSource: 'aws:ses';
      eventVersion: string;
      ses: SESNotification;
    }
  ];
}
