import { ClientResponse } from '@sendgrid/client/src/response';
import { ResponseError } from '@sendgrid/helpers/classes';
import { NextApiRequest, NextApiResponse } from 'next';
import { ApiError, User, Appt, ApptJSONInterface } from '../../model';
import { Email, ApptEmail } from '../../emails';

import { v4 as uuid } from 'uuid';
import to from 'await-to-js';
import mail from '@sendgrid/mail';
import * as admin from 'firebase-admin';

mail.setApiKey(process.env.SENDGRID_API_KEY as string);

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
      await to<[ClientResponse, {}], Error | ResponseError>(mail.send(email));
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
 * @todo Lift this Firebase app definition to a top-leve file that is imported
 * by all the `/api/` endpoints.
 */
const firebase: App = admin.initializeApp(
  {
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_ADMIN_KEY,
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
 * 4. Updates each `attendee`'s availability (in their Firestore profile
 * document) to reflect this appointment (i.e. removes the appointment's `time`
 * from their availability).
 * 5. Creates a new `appt` document containing the request body in each of the
 * `attendee`'s Firestore `appts` subcollection.
 * 6. Sends each of the `appt`'s `attendee`'s an email containing:
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
        appt.id = (attendees[0].ref as DocumentReference)
          .collection('appts')
          .doc().id;
        console.log(`[DEBUG] Creating appt (${appt.id})...`);
        await Promise.all(
          attendees.map(async (attendee: User) => {
            // 4. Update the attendees availability.
            attendee.availability.remove(appt.time);
            await (attendee.ref as DocumentReference).update(
              attendee.toFirestore()
            );
            // 5. Create the appointment Firestore document.
            await (attendee.ref as DocumentReference)
              .collection('appts')
              .doc(appt.id as string)
              .set(appt.toFirestore());
          })
        );
        // 6. Send out the invitation email to the attendees.
        await sendApptEmails(appt, attendees);
        res.status(201).json({ appt: appt.toJSON() });
      }
    }
  }
}
