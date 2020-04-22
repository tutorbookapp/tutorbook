import { NextApiRequest, NextApiResponse } from 'next';
import { Appt } from '../../model';

import { v4 as uuid } from 'uuid';
import to from 'await-to-js';
import * as admin from 'firebase-admin';

type DocumentReference = admin.firestore.DocumentReference;
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
      type: process.env.FIREBASE_ADMIN_TYPE,
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_ADMIN_KEY_ID,
      private_key: process.env.FIREBASE_ADMIN_KEY,
      client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_ADMIN_CLIENT_ID,
      auth_uri: process.env.FIREBASE_ADMIN_AUTH_URI,
      token_uri: process.env.FIREBASE_ADMIN_TOKEN_URI,
      auth_provider_x509_cert_url: process.env.FIREBASE_ADMIN_PROVIDER_CERT_URL,
      client_x509_cert_url: process.env.FIREBASE_ADMIN_CLIENT_CERT_URL,
    }),
    projectId: process.env.FIREBASE_PROJECT_ID,
    serviceAccountId: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    databaseAuthVariableOverride: {
      uid: 'server',
    },
  },
  uuid()
);

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
 */
export default async function appt(
  req: NextApiRequest,
  res: NextApiResponse<void>
): Promise<void> {
  // 1. Verify that the request body is valid.
  if (!req.body) {
    res.status(400).send('You must provide a request body.');
  } else if (!req.body.appt) {
    res.status(400).send('Your request body must contain a user field.');
  } else if (!req.body.appt.subjects || !req.body.appt.subjects.length) {
    res.status(400).send('Your appointment must contain valid subjects.');
  } else if (!req.body.appt.attendees || req.body.appt.attendees.length < 2) {
    res.status(400).send('Your appointment must have at least 2 attendees.');
  } else if (!req.body.appt.time || typeof req.body.appt.time !== 'object') {
    res.status(400).send('Your appointment must have a valid time.');
  } else if (new Date(req.body.appt.time.from).toString() === 'Invalid Date') {
    res.status(400).send('Your appointment must have a valid starting time.');
  } else if (new Date(req.body.appt.time.to).toString() === 'Invalid Date') {
    res.status(400).send('Your appointment must have a valid ending time.');
  } else {
    const appt: Appt = Appt.fromJSON(req.body.appt);
    const attendees: User[] = [];
    for (const attendee of appt.attendees) {
      const ref: DocumentReference = db.collection('users').doc(attendee.uid);
      const doc: DocumentSnapshot = await ref.get();
      // 1b. Verify that the attendees exist.
      if (!doc.exists) {
        res.status(400).send(`Attendee (${attendee.uid}) did not exist.`);
        break;
      }
      const user: User = User.fromFirestore(doc);
      // 2. Verify that the attendees are available.
      if (!user.availability.contains(appt.time)) {
        res
          .status(400)
          .send(
            `${user.name} (${user.uid}) is not available on ` +
              `${appt.time.toString(true)}.`
          );
        break;
      }
      // 3. Verify the tutors can teach the requested subjects.
      if (
        attendee.roles.indexOf('tutor') >= 0 &&
        !appt.subjects.every((subject: string) =>
          user.subjects.explicit.includes(subject)
        )
      ) {
        res
          .status(400)
          .send(
            `${user.name} (${user.uid}) cannot teach all of ` +
              'the requested subjects.'
          );
        break;
      }
      attendees.push(user);
    }
    if (attendees.length === appt.attendees.length) {
      const id: string = attendees[0].ref.collection('appts').doc().id;
      await Promise.all(
        attendees.map((attendee: User) => {
          // 4. Update the attendees availability.
          attendee.availability.remove(appt.time);
          await attendee.ref.update(attendee.toFirestore());
          // 5. Create the appointment Firestore document.
          await attendee.ref
            .collection('appts')
            .doc(id)
            .set(appt.toFirestore());
        })
      );
      // 6. TODO: Send out the invitation email to the attendees.
    }
  }
}
