import { ClientResponse } from '@sendgrid/client/src/response';
import { ResponseError } from '@sendgrid/helpers/classes';
import { NextApiRequest, NextApiResponse } from 'next';
import { AxiosResponse, AxiosPromise } from 'axios';
import { ApiError, User, Appt, ApptJSONInterface } from '../../model';
import { Email, ApptEmail } from '../../emails';

import { v4 as uuid } from 'uuid';
import axios from 'axios';
import to from 'await-to-js';
import mail from '@sendgrid/mail';
import * as admin from 'firebase-admin';

mail.setApiKey(process.env.SENDGRID_API_KEY as string);

interface BrambleRes {
  APImethod: string;
  status: string;
  result: string;
}

/**
 * Creates a new Bramble room using their REST API.
 * @see {@link https://about.bramble.io/api.html}
 */
function createBrambleRoom(appt: Appt): AxiosPromise<BrambleRes> {
  return axios({
    method: 'post',
    url: 'https://api.bramble.io/createRoom',
    headers: {
      room: appt.id,
      agency: 'tutorbook',
      auth_token: process.env.BRAMBLE_API_KEY as string,
    },
  });
}

/**
 * Sends out invite emails to all of the new appointment's attendees with:
 * - A link to a shared Google Drive.
 * - A link to a private Slack Channel.
 * - A link to an anonymous shared virtual whiteboard.
 */
async function sendApptEmails(
  appt: Appt,
  recipients: ReadonlyArray<User>
): Promise<void> {
  await Promise.all(
    recipients.map(async (recipient: User) => {
      const email: Email = new ApptEmail(recipient, appt, recipients);
      const [err] = await to<[ClientResponse, {}], Error | ResponseError>(
        mail.send(email)
      );
      if (err) {
        console.error(
          `[ERROR] ${err.name} while sending ${recipient.name} ` +
            `<${recipient.email}> the appt (${appt.id}) email:`,
          err
        );
      } else {
        console.log(
          `[DEBUG] Sent ${recipient.name} <${recipient.email}> the appt email.`
        );
      }
    })
  );
}

/**
 * Type aliases so that we don't have to type out the whole type. We could try
 * importing these directly from the `@firebase/firestore-types` or the
 * `@google-cloud/firestore` packages, but that's not recommended.
 * @todo Perhaps figure out a way to **only** import the type defs we need.
 */
type DocumentReference = admin.firestore.DocumentReference;
type DocumentSnapshot = admin.firestore.DocumentSnapshot;
type DecodedIdToken = admin.auth.DecodedIdToken;
type Auth = admin.auth.Auth;
type App = admin.app.App;

/**
 * This is a desperate workaround for an error we're encountering regarding
 * Vercel Now environment variables. For some reason, it's formatting this
 * Firebase Admin Node.js SDK API key wrong and causing an error.
 * @see {@link https://github.com/tutorbookapp/covid-tutoring/issues/29}
 */
const FIREBASE_ADMIN_KEY: string =
  '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCusqyx2PhdhOV4\niYWgfwRkYznGfw/QODZ7WqKTY4D+OZrAuUqA2TrijRgc3XXhAklvz3pRScYoT899\nT9dnqKFkjEZHfujhCPRVM5KNntiMd+sQ+H8HcuKUTjHRK2y7PP+zbizYfeQN0Uuy\njoRBfDwzJmhzuKuJOLHWvAvyghEmwcjaNg0E4KrUbtB2MK9GjZQfmkWtNK5ioj6g\nTGeN/R0S2Ny9t0RQJbYNleSwG8VmRWqbFDkvlU7S9nHqgqCZKWJLrEZSRGaxphvN\neXqgRmtCskwGyiKZhmZXOp7wzTpqmyUgMhwm9X3tBaswWeNMuDU7+d//ivvgOQxV\nDd7kQ16xAgMBAAECggEADW7NMx6nGE/J8j8G0Jy7qnlrvZzTCzRrUghZ1GH0DvhA\ncz28IhSx/64QMtX/hKXvniKSufHlg/+BCZZsTnrrsAbON5ylTPpqiSueQvf6GDD3\nWPZ2lAzMKdGqaHZBldMeqT4ZQitJ8BsOCkSFnGBwY5F6Oh2yyOocWJHcjFDefz+K\nSwhW/cE70VUshFYi3Fuz/e0OgP0zyVRm6Us3gqtcxoPeN+w7jqmV/O8QO6OJWJqy\nq+ePN/ovZVentif+hXUm8WitSLqYS4ayMrmm/lv0BypO3SPu+yID1CU6s4//TDYs\n7b8SGG+tZFLFAtqQhWw4bknaURMRwN0do/GGPlajjQKBgQDWNsNA6Pa1VDhb7Ib3\nnoHo4jOMYwYYS9QdAGcrdUqsdL885LJgSY3LJqvTklXQFuIwM6otWT2yiTRuj7KV\nNmM/h76MfxbDSW+RjPzG+jP9UT+CGs+39xGdOteSp2PFun8o5gXn7MK09l2PUt2C\nnk9Qjv4qux7/w8MVNSwkpHc8HQKBgQDQxpia2jqtrWAbbpDAVL21mMPIT9k5695c\n388/bgLsrivgJbS9eRRSdZL/cJ3JtywYReYsOJ8/JIfbDbYdODGZHco0vkRboatv\nWA3EJVTr2RJ32uTVIs4/m/igksjA103GqUzj0kVJDwh2NXg+ZCBHxpXYp20st/hO\n7nGcyp4gpQKBgQCfCJMXCp22a2tYG5bsGTqbOexJSm8I9KrqSRVPN0oUFKyxuZwQ\nTis96lzguyCIV6TfYkvyVPGwLZrGhlpv2qv+S3oU9nlgzJFO/tvfoXudkodSwTL7\ngisKjtfiofE5p8amB3fVAnpfPRSixkN7qKp7xV0/PiK6gYzAnvRB0/RNpQKBgGYP\nj+6znFfnF8KRTIYZZxxtb9hu4HymR/ATIVeayic2BhDvnem6VSrye0gQn7JKr222\nTg10KLVPgHKfw1WJcQWvQHiEQxqgcBRgcWpf7aHWXmblRVTETRtffi3RU/6hwk3J\n2eLNmj1a8gIHpZ6qh/VOqVZeksp3rRW5DyVdD+xZAoGBAJCjUdlgCBee6uVUiCmh\nz01uN7tOMbxg1x71mdGUaoyJL4tj8lIQWKvDgDf3T6f27dB7Y+CY7Wr/LxTCAW3w\n/uVrz/BS4XC3VD7jvKADXq7RAYg1sJAto/wKCS5uvvv24nGKiy72/5mkn6Rp4dsn\n7LiDVx9tOLtqCwLNzUwFnKa5\n-----END PRIVATE KEY-----\n';

/**
 * Initializes a new `firebase.admin` instance with limited database/Firestore
 * capabilities (using the `databaseAuthVariableOverride` option).
 * @see {@link https://firebase.google.com/docs/reference/admin/node/admin.AppOptions#optional-databaseauthvariableoverride}
 * @see {@link https://firebase.google.com/docs/database/admin/start#authenticate-with-limited-privileges}
 *
 * Also note that we use [UUID]{@link https://github.com/uuidjs/uuid} package to
 * generate a unique `firebaseAppId` every time this API is called.
 * @todo Lift this Firebase app definition to a top-leve file that is imported
 * by all the `/api/` endpoints.
 */
const firebase: App = admin.initializeApp(
  {
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: FIREBASE_ADMIN_KEY,
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

const auth: Auth = firebase.auth();
const db: DocumentReference =
  process.env.NODE_ENV === 'development'
    ? firebase.firestore().collection('partitions').doc('test')
    : firebase.firestore().collection('partitions').doc('default');

/**
 * Takes an `ApptJSONInterface` object, an authentication token, and:
 * 1. Verifies the correct request body was sent (e.g. all parameters are there
 * and are all of the correct types).
 * 2. Verifies that the requested `Timeslot` is within all of the `attendee`'s
 * availability (by reading each `attendee`'s Firestore profile document).
 * 3. Verifies that the requested `subjects` are included in each of the tutors'
 * Firestore profile documents (where a tutor is defined as an `attendee` whose
 * `roles` include `tutor`).
 * 4. Creates the Bramble tutoring lesson room.
 * 5. Creates a new `appt` document containing the request body in each of the
 * `attendee`'s Firestore `appts` subcollection.
 * 6. Updates each `attendee`'s availability (in their Firestore profile
 * document) to reflect this appointment (i.e. removes the appointment's `time`
 * from their availability).
 * 7. Sends each of the `appt`'s `attendee`'s an email containing:
 *    - Link to a scheduled, recurring (weekly) Zoom meeting.
 *    - Link to a virtual whiteboard (probably using
 *    [DrawChat](https://github.com/cojapacze/sketchpad)).
 *    - Link to a shared Google Drive folder.
 *
 * @param {string} token - A valid Firebase Authentication JWT `idToken` to
 * authorize the request. You're able to get this token by calling the `user`
 * REST API endpoint (an endpoint that will create a new user and give you a
 * `customToken` to sign-in with).
 * @param {ApptJSONInterface} appt - The appointment to create. The given
 * `idToken` **must** be from one of the appointment's `attendees` (see the
 * above description for more requirements).
 */
export default async function appt(
  req: NextApiRequest,
  res: NextApiResponse<ApiError | { appt: ApptJSONInterface }>
): Promise<void> {
  // 1. Verify that the request body is valid.
  function error(msg: string, code: number = 400, err?: Error): void {
    res.status(code).json(Object.assign({ msg }, err || {}));
  }
  if (!req.body) {
    error('You must provide a request body.');
  } else if (!req.body.appt || typeof req.body.appt !== 'object') {
    error('Your request body must contain a user field.');
  } else if (!req.body.appt.subjects || !req.body.appt.subjects.length) {
    error('Your appointment must contain valid subjects.');
  } else if (!req.body.appt.attendees || req.body.appt.attendees.length < 2) {
    error('Your appointment must have >= 2 attendees.');
  } else if (!req.body.appt.time || typeof req.body.appt.time !== 'object') {
    error('Your appointment must have a valid time.');
  } else if (new Date(req.body.appt.time.from).toString() === 'Invalid Date') {
    error('Your appointment must have a valid start time.');
  } else if (new Date(req.body.appt.time.to).toString() === 'Invalid Date') {
    error('Your appointment must have a valid end time.');
  } else if (!req.body.token || typeof req.body.token !== 'string') {
    error('You must provide a valid Firebase Auth JWT.', 401);
  } else {
    const [err, token] = await to<DecodedIdToken>(
      auth.verifyIdToken(req.body.token, true)
    );
    if (err) {
      error(`Your Firebase Auth JWT is invalid: ${err.message}`, 401, err);
    } else {
      const appt: Appt = Appt.fromJSON(req.body.appt);
      const attendees: User[] = [];
      let attendeesIncludeAuthToken: boolean = false;
      for (const attendee of appt.attendees) {
        // 1b. Verify that the attendees have uIDs.
        if (!attendee.uid) {
          error('All attendees must have valid uIDs.');
          break;
        }
        if (attendee.uid === (token as DecodedIdToken).uid)
          attendeesIncludeAuthToken = true;
        const ref: DocumentReference = db.collection('users').doc(attendee.uid);
        const doc: DocumentSnapshot = await ref.get();
        // 1c. Verify that the attendees exist.
        if (!doc.exists) {
          error(`Attendee (${attendee.uid}) does not exist.`);
          break;
        }
        const user: User = User.fromFirestore(doc);
        // 2. Verify that the attendees are available.
        if (!user.availability.contains(appt.time)) {
          error(`${user.name} (${user.uid}) is not available on ${appt.time}.`);
          break;
        }
        // 3. Verify the tutors can teach the requested subjects.
        const isTutor: boolean = attendee.roles.indexOf('tutor') >= 0;
        const canTeachSubject: (s: string) => boolean = (subject: string) => {
          return user.subjects.explicit.includes(subject);
        };
        if (isTutor && !appt.subjects.every(canTeachSubject)) {
          error(`${user.name} (${user.uid}) cannot teach requested subjects.`);
          break;
        }
        attendees.push(user);
      }
      if (!attendees.length || attendees.length !== appt.attendees.length) {
        // Don't do anything b/c we already sent error code to client.
      } else if (!attendeesIncludeAuthToken) {
        error(
          `Appointment creator (${(token as DecodedIdToken).uid}) must attend` +
            ' the tutoring appointment.'
        );
      } else {
        // 4. Create a new Bramble room for the tutoring appointment.
        appt.id = (attendees[0].ref as DocumentReference)
          .collection('appts')
          .doc().id;
        console.log(`[DEBUG] Creating Bramble room (${appt.id})...`);
        const [err, brambleRes] = await to<AxiosResponse<BrambleRes>>(
          createBrambleRoom(appt)
        );
        if (err) {
          console.error(`[ERROR] ${err.name} creating Bramble room:`, err);
          error(`${err.name} creating Bramble room: ${err.message}`, 500, err);
        } else {
          const brambleURL: string = (brambleRes as AxiosResponse<BrambleRes>)
            .data.result;
          appt.venues.push({
            type: 'bramble',
            url: brambleURL,
            description:
              `Join your tutoring lesson via <a href="${brambleURL}">this ` +
              'Bramble room</a>. Your room will be reused weekly until your ' +
              'tutoring lesson is cancelled. To learn more about Bramble, ' +
              'head over to <a href="https://about.bramble.io/help/help-home' +
              '.html">their help center</a>.',
          });
          console.log(`[DEBUG] Creating appt (${appt.id})...`);
          await Promise.all(
            attendees.map(async (attendee: User) => {
              // 5. Create the appointment Firestore document.
              await (attendee.ref as DocumentReference)
                .collection('appts')
                .doc(appt.id as string)
                .set(appt.toFirestore());
              // 6. Update the attendees availability.
              attendee.availability.remove(appt.time);
              await (attendee.ref as DocumentReference).update(
                attendee.toFirestore()
              );
            })
          );
          // 7. Send out the invitation email to the attendees.
          await sendApptEmails(appt, attendees);
          res.status(201).json({ appt: appt.toJSON() });
        }
      }
    }
  }
}
