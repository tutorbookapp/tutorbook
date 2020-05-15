import { ClientResponse } from '@sendgrid/client/src/response';
import { ResponseError } from '@sendgrid/helpers/classes';
import { NextApiRequest, NextApiResponse } from 'next';
import { AxiosResponse, AxiosPromise } from 'axios';
import { ApiError, User, Appt, ApptJSONInterface } from '../../model';
import { Email, RequestEmail, ParentRequestEmail } from '../../emails';

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
 * Sends out two types of emails:
 * 1. Email to the pupil attendees's parents asking for parental approval of the
 * tutoring match (the attendees are not sent the link to the Bramble room until
 * **after** we receive parental consent).
 * 2. Email to the pupil attendees letting them know that we've received their
 * request and are awaiting parental approval.
 * @todo Give the pupils an option to change their parent's contact info in
 * that second email (i.e. you might have entered fake stuff just to see search
 * results and now you can't do anything because those parental emails aren't
 * going where they should be).
 */
async function sendRequestEmails(
  appt: Appt,
  recipients: ReadonlyArray<User>
): Promise<void> {
  await Promise.all(
    recipients.map(async (recipient: User) => {
      if (recipient.roles.indexOf('pupil') < 0) return;
      for (const parentUID of recipient.parents) {
        const parentDoc: DocumentSnapshot = await db
          .collection('users')
          .doc(parentUID)
          .get();
        if (parentDoc.exists) {
          const parent: User = User.fromFirestore(parentDoc);
          const email: Email = new ParentRequestEmail(
            parent,
            recipient,
            appt,
            recipients
          );
          const [err] = await to<[ClientResponse, {}], Error | ResponseError>(
            mail.send(email)
          );
          if (err) {
            console.error(
              `[ERROR] ${err.name} sending ${parent.name} <${parent.email}> ` +
                `the parent appt (${appt.id}) email:`,
              err
            );
          } else {
            console.log(
              `[DEBUG] Sent ${parent.name} <${parent.email}> the parent appt ` +
                `(${appt.id}) email.`
            );
          }
        } else {
          console.warn(`[WARNING] Parent (${parentUID}) did not exist.`);
        }
      }
      const email: Email = new RequestEmail(recipient, appt, recipients);
      const [err] = await to<[ClientResponse, {}], Error | ResponseError>(
        mail.send(email)
      );
      if (err) {
        console.error(
          `[ERROR] ${err.name} sending ${recipient.name} <${recipient.email}>` +
            ` the appt (${appt.id}) email:`,
          err
        );
      } else {
        console.log(
          `[DEBUG] Sent ${recipient.name} <${recipient.email}> the appt ` +
            `(${appt.id}) email.`
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
 * Initializes a new `firebase.admin` instance with limited database/Firestore
 * capabilities (using the `databaseAuthVariableOverride` option).
 * @see {@link https://firebase.google.com/docs/reference/admin/node/admin.AppOptions#optional-databaseauthvariableoverride}
 * @see {@link https://firebase.google.com/docs/database/admin/start#authenticate-with-limited-privileges}
 *
 * Also note that we use [UUID]{@link https://github.com/uuidjs/uuid} package to
 * generate a unique `firebaseAppId` every time this API is called.
 * @todo Lift this Firebase app definition to a top-level file that is imported
 * by all the `/api/` endpoints.
 */
const firebase: App = admin.initializeApp(
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

const auth: Auth = firebase.auth();
const db: DocumentReference =
  process.env.NODE_ENV === 'development'
    ? firebase.firestore().collection('partitions').doc('test')
    : firebase.firestore().collection('partitions').doc('default');

/**
 * Takes an `ApptJSONInterface` object, an authentication token, and:
 * 1. Performs the following verifications (sends a `400` error code and an
 *    accompanying human-readable error message if any of them fail):
 *    - Verifies the correct request body was sent (e.g. all parameters are there
 *      and are all of the correct types).
 *    - Verifies that the requested `Timeslot` is within all of the `attendee`'s
 *      availability (by reading each `attendee`'s Firestore profile document).
 *    - Verifies that the requested `subjects` are included in each of the
 *      tutors' Firestore profile documents (where a tutor is defined as an
 *      `attendee` whose `roles` include `tutor`).
 *    - Verifies that the given `token` belongs to one of the `appt`'s
 *      `attendees`.
 * 2. Creates [the Bramble tutoring lesson room]{@link https://about.bramble.io/api.html}
 *    (so that the parent can preview the venue that their child will be using
 *    to connect with their tutor).
 * 3. Creates a new `request` document containing the given `appt`'s data in the
 *    pupil's (the owner of the given JWT `token`) Firestore sub-collections.
 * 4. Sends an email to the pupil's parent(s) asking for parental approval of
 *    the tutoring match.
 * 5. Sends an email to the pupil (the sender of the lesson request) telling
 *    them that we're awaiting parental approval.
 *
 * @param {string} token - A valid Firebase Authentication JWT `idToken` to
 * authorize the request. You're able to get this token by calling the `user`
 * REST API endpoint (an endpoint that will create a new user and give you a
 * `customToken` to sign-in with).
 * @param {ApptJSONInterface} appt - The appointment to create a pending request
 * for. The given `idToken` **must** be from one of the appointment's
 * `attendees` (see the above description for more requirements).
 */
export default async function request(
  req: NextApiRequest,
  res: NextApiResponse<ApiError | { request: ApptJSONInterface }>
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
        // 1. Verify that the attendees have uIDs.
        if (!attendee.uid) {
          error('All attendees must have valid uIDs.');
          break;
        }
        if (attendee.uid === (token as DecodedIdToken).uid)
          attendeesIncludeAuthToken = true;
        const ref: DocumentReference = db.collection('users').doc(attendee.uid);
        const doc: DocumentSnapshot = await ref.get();
        // 1. Verify that the attendees exist.
        if (!doc.exists) {
          error(`Attendee (${attendee.uid}) does not exist.`);
          break;
        }
        const user: User = User.fromFirestore(doc);
        // 1. Verify that the attendees are available.
        if (!user.availability.contains(appt.time)) {
          error(`${user.name} (${user.uid}) is not available on ${appt.time}.`);
          break;
        }
        // 1. Verify the tutors can teach the requested subjects.
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
        // 2. Create a new Bramble room for the tutoring appointment.
        appt.id = (attendees[0].ref as DocumentReference)
          .collection('requests')
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
          console.log(`[DEBUG] Creating pending request (${appt.id})...`);
          await Promise.all(
            attendees.map(async (attendee: User) => {
              if (attendee.roles.indexOf('pupil') < 0) return;
              // 3. Create the appointment Firestore document.
              await (attendee.ref as DocumentReference)
                .collection('requests')
                .doc(appt.id as string)
                .set(appt.toFirestore());
            })
          );
          // 4-5. Send out the pending request emails.
          await sendRequestEmails(appt, attendees);
          res.status(201).json({ request: appt.toJSON() });
          console.log(`[DEBUG] Created request (${appt.id}) and sent emails.`);
        }
      }
    }
  }
}
