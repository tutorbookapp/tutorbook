import { AWSError } from 'aws-sdk/lib/error';
import { v4 as uuid } from 'uuid';
import S3 from 'aws-sdk/clients/s3';
import SES from 'aws-sdk/clients/ses';
import admin from 'firebase-admin';
import to from 'await-to-js';

import {
  FirebaseApp,
  FirebaseError,
  FirebaseAuth,
  UserRecord,
  MailEvent,
  SESNotification,
  DocumentSnapshot,
  DocumentReference,
  Attendee,
} from './types';

/**
 * Initializes a new `firebase.admin` instance with limited database/Firestore
 * capabilities (using the `databaseAuthVariableOverride` option).
 * @see {@link https://firebase.google.com/docs/reference/admin/node/admin.AppOptions#optional-databaseauthvariableoverride}
 * @see {@link https://firebase.google.com/docs/database/admin/start#authenticate-with-limited-privileges}
 *
 * Also note that we use [UUID]{@link https://github.com/uuidjs/uuid} package to
 * generate a unique `firebaseAppId` every time this API is called.
 * @todo Lift this Firebase app definition to a top-level file that is imported
 * by all the `/api/` endpoints.
 *
 * We have a workaround for the `FIREBASE_ADMIN_KEY` error we were encountering
 * on Vercel a while ago.
 * @see {@link https://github.com/tutorbookapp/covid-tutoring/issues/29}
 * @see {@link https://stackoverflow.com/a/41044630/10023158}
 * @see {@link https://stackoverflow.com/a/50376092/10023158}
 */
const firebase: FirebaseApp = admin.initializeApp(
  {
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: (process.env.FIREBASE_ADMIN_KEY as string).replace(
        /\\n/g,
        '\n'
      ),
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    }),
    projectId: process.env.FIREBASE_PROJECT_ID,
    serviceAccountId: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    databaseAuthVariableOverride: { uid: 'server' },
  },
  uuid()
);
const s3: S3 = new S3();
const ses: SES = new SES();
const auth: FirebaseAuth = firebase.auth();
const db: DocumentReference = firebase
  .firestore()
  .collection('partitions')
  .doc('default');
const whitelist: RegExp[] = [/@tutorbook\.org$/];
const bucketId = 'tutorbook-mail';

/**
 * Takes a user's actual email and returns their anonymized email (i.e. their
 * `<uid>-<appt>@mail.tutorbook.org` email address).
 *
 * If a user doesn't already exist, we create that user and add them to the
 * appointment's `attendees` field.
 *
 * @todo Get the user's name (from the original `From:` header) and use it when
 * creating new users.
 *
 * @todo Create the user's Firestore profile document as well (and populate it
 * with the default `User` data model values).
 */
async function getAnonEmail(
  realEmail: string,
  appt: DocumentSnapshot
): Promise<string> {
  if (whitelist.some((rgx: RegExp) => rgx.test(realEmail))) return realEmail;
  const [err, user] = await to<UserRecord, FirebaseError>(
    auth.getUserByEmail(realEmail)
  );
  if (err && err.code === 'auth/user-not-found') {
    console.log(`[DEBUG] Creating new user (${realEmail})...`);
    /* eslint-disable-next-line no-shadow */
    const [err, user] = await to<UserRecord, FirebaseError>(
      auth.createUser({ email: realEmail })
    );
    if (err) {
      throw new Error(
        `${err.name} creating user (${realEmail}): ${err.message}`
      );
    } else {
      const id: string = (user as UserRecord).uid;
      const attendee: Attendee = { id, roles: [] };
      const attendees = (appt.data() || {}).attendees as Attendee[];
      await appt.ref.update({ attendees: [...attendees, attendee] });
      return `${id}-${appt.id}@mail.tutorbook.org`;
    }
  } else if (err) {
    throw new Error(`${err.name} fetching user (${realEmail}): ${err.message}`);
  } else {
    return `${(user as UserRecord).uid}-${appt.id}@mail.tutorbook.org`;
  }
}

/**
 * Takes a user's anonymized email (i.e. their `<uid>-<appt>@mail.tutorbook.org`
 * email address) and returns their actual email.
 */
async function getRealEmail(anonEmail: string): Promise<string> {
  const [err, user] = await to<UserRecord, FirebaseError>(
    auth.getUser(anonEmail.split('@')[0].split('-')[0])
  );
  if (err) {
    throw new Error(`${err.name} fetching user (${anonEmail}): ${err.message}`);
  } else if (!(user as UserRecord).email) {
    throw new Error(`User (${(user as UserRecord).uid}) has no email.`);
  } else {
    return (user as UserRecord).email as string;
  }
}

/**
 * An easy function to use and understand async replace. Enables you to use an
 * async replacement function.
 * @see {@link https://stackoverflow.com/a/48032528/10023158}
 */
async function replaceAsync(
  str: string,
  regex: RegExp,
  asyncFn: (match: string, ...args: any[]) => Promise<string>
): Promise<string> {
  const promises: Promise<string>[] = [];
  str.replace(regex, (match: string, ...args: any[]) => {
    promises.push(asyncFn(match, ...args));
    return '';
  });
  const data: string[] = await Promise.all(promises);
  return str.replace(regex, () => data.shift() as string);
}

/**
 * Replaces the email address in a given header with an anonymous email address.
 * @example
 * const orig = 'Reply-To: Nicholas Chiang <nicholas@tutorbook.org>'
 * const anon = replaceRealWithAnon(orig);
 * assert(anon === 'Reply-To: Nicholas Chiang <53GEmgLupal@mail.tutorbook.org');
 *
 * @todo Handle cases where the header looks like: `From: bob@tutorbook.org`
 * (instead of the expected `From: Bob <bob@tutorbook.org>`).
 */
async function replaceRealWithAnon(
  header: string,
  appt: DocumentSnapshot
): Promise<string> {
  if (header.indexOf('mail.tutorbook.org') >= 0) return header;
  return replaceAsync(
    header,
    /<(.*)>/,
    async (_, realEmail: string) => `<${await getAnonEmail(realEmail, appt)}>`
  );
}

/**
 * An AWS Lambda function that is invoked every time we receive an email. This
 * function:
 * 1. Looks up the sender and recipient of the email in our Firestore database.
 * 2. Updates the `From` and `Reply-To` headers to be the sender's anonymized
 * email address (i.e. their `@mail.tutorbook.org` email address).
 * 3. Fetches the email content from AWS S3 and forwards it to the intended
 * recipient.
 */
/* eslint-disable-next-line import/prefer-default-export */
export function handler(event: MailEvent): void {
  const notification: SESNotification = event.Records[0].ses;

  console.log('[DEBUG] Processing:', JSON.stringify(notification, null, 2));

  async function callback(
    err: AWSError,
    data: S3.Types.GetObjectOutput
  ): Promise<void> {
    if (err) {
      throw new Error(`${err.name} accessing S3 (${bucketId}): ${err.message}`);
    } else if (!data.Body) {
      throw new Error(`Email (${notification.mail.messageId}) was empty.`);
    } else {
      // Update the recipients (convert the anonymized emails to actual emails).
      // Anonymized emails are formatted as: `<uid>-<appt>@mail.tutorbook.org`
      const recipients: Record<string, string> = {};
      const apptIds: Set<string> = new Set();
      await Promise.all(
        notification.receipt.recipients.map(async (anonEmail: string) => {
          recipients[anonEmail] = await getRealEmail(anonEmail);
          apptIds.add(anonEmail.split('@')[0].split('-')[1]);
        })
      );

      // We reject the email if there are anonymous email address for multiple
      // appointments in the same email.
      // TODO: Use the SES SDK to reject the email with this error message.
      if (apptIds.size !== 1) throw new Error('Multiple appointments.');

      // Split the email into it's `headers` and `body` parts.
      // @see {@link https://bit.ly/3iJx50F}
      const splitRegex = /^((?:.+\r?\n)*)(\r?\n(?:.*\s+)*)/m;
      const emailData: string = data.Body.toString();
      const match: null | string[] = splitRegex.exec(emailData);
      const body: string = match && match[2] ? match[2] : '';
      let headers: string = match && match[1] ? match[1] : emailData;

      // Remove the 'Return-Path', 'Sender', and 'Message-ID' headers.
      headers = headers.replace(/^return-path:[\t ]?(.*)\r?\n/gim, '');
      headers = headers.replace(/^sender:[\t ]?(.*)\r?\n/gim, '');
      headers = headers.replace(/^message-id:[\t ]?(.*)\r?\n/gim, '');

      // Remove all 'DKIM-Signature' headers to prevent triggering an
      // "InvalidParameterValue: Duplicate header 'DKIM-Signature'" error.
      // These signatures will likely be invalid anyways, since the 'From'
      // header was modified.
      headers = headers.replace(
        /^dkim-signature:[\t ]?.*\r?\n(\s+.*\r?\n)*/gim,
        ''
      );

      // Abort this operation if the Firestore document already exists (because
      // AWS Lambda functions can be invoked multiple times; the queue is
      // *eventually* consistent).
      // @see {@link https://amzn.to/38IqQ8S}
      const doc: DocumentSnapshot = await db
        .collection('appts')
        .doc(apptIds.values().next().value)
        .collection('emails')
        .doc(notification.mail.messageId)
        .get();
      if (doc.exists) throw new Error('Email has already been processed.');

      // Anonymize any real email addresses.
      await Promise.all(
        [
          /^reply-to:[\t ]?(.*(?:\r?\n\s+.*)*)/gim,
          /^from:[\t ]?(.*(?:\r?\n\s+.*)*)/gim,
          /^cc:[\t ]?(.*(?:\r?\n\s+.*)*)/gim,
          /^bcc:[\t ]?(.*(?:\r?\n\s+.*)*)/gim,
          /^to:[\t ]?(.*(?:\r?\n\s+.*)*)/gim,
        ].map(async (regex: RegExp) => {
          const replacer = (header: string) => replaceRealWithAnon(header, doc);
          headers = await replaceAsync(headers, regex, replacer);
        })
      );

      // Store the email in the appointment's `emails` Firestore subcollection.
      await doc.ref.set({ ...notification.mail, raw: `${headers}${body}` });

      // For each anonymized recipient, replace their (anonymized) email address
      // (with their real one) and relay the updated message.
      Object.entries(recipients).map(([anon, real]) =>
        ses.sendRawEmail(
          {
            Destinations: [real],
            RawMessage: { Data: `${headers.replace(anon, real)}${body}` },
          },
          (error: AWSError, response: SES.Types.SendRawEmailResponse) => {
            console.log(
              '[DEBUG] Email:',
              `${headers.replace(anon, real)}${body}`
            );
            if (error) {
              throw new Error(`${error.name} sending email: ${error.message}`);
            } else {
              console.log(
                '[DEBUG] Sent email:',
                JSON.stringify(response, null, 2)
              );
            }
          }
        )
      );
    }
  }

  s3.getObject(
    { Bucket: bucketId, Key: notification.mail.messageId },
    (err: AWSError, data: S3.Types.GetObjectOutput) => {
      void callback(err, data);
    }
  );
}
