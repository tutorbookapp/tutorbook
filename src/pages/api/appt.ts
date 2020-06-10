/* eslint-disable no-shadow */

import { ClientResponse } from '@sendgrid/client/src/response';
import { ResponseError } from '@sendgrid/helpers/classes';
import { NextApiRequest, NextApiResponse } from 'next';
import {
  ApiError,
  User,
  UserWithRoles,
  Appt,
  ApptJSONInterface,
} from '@tutorbook/model';
import { ApptEmail } from '@tutorbook/emails';

import { v4 as uuid } from 'uuid';
import to from 'await-to-js';
import mail from '@sendgrid/mail';
import * as admin from 'firebase-admin';

mail.setApiKey(process.env.SENDGRID_API_KEY as string);

/**
 * Sends out invite emails to all of the new appointment's attendees with a link
 * to their Bramble room and instructions on how to make the best out of their
 * virtual tutoring session.
 */
async function sendApptEmails(
  appt: Appt,
  attendees: ReadonlyArray<User>
): Promise<void> {
  await Promise.all(
    attendees.map(async (attendee: User) => {
      /* eslint-disable-next-line @typescript-eslint/ban-types */
      const [err] = await to<[ClientResponse, {}], Error | ResponseError>(
        mail.send(new ApptEmail(attendee, appt, attendees))
      );
      if (err) {
        console.error(
          `[ERROR] ${err.name} sending ${attendee.name} <${attendee.email}>` +
            ` the appt (${appt.id as string}) email:`,
          err
        );
      } else {
        console.log(
          `[DEBUG] Sent ${attendee.name} <${attendee.email}> the appt ` +
            `(${appt.id as string}) email.`
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
type CollectionReference = admin.firestore.CollectionReference;
type DocumentReference = admin.firestore.DocumentReference;
type DocumentSnapshot = admin.firestore.DocumentSnapshot;
type Firestore = admin.firestore.Firestore;
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

const firestore: Firestore = firebase.firestore();

/**
 * Takes an `ApptJSONInterface` object, an authentication token, and:
 * 1. Verifies the correct request body was sent (e.g. all parameters are there
 *    and are all of the correct types).
 * 2. Fetches the given pending request's data from our Firestore database.
 * 3. Performs the following verifications (some of which are also included in
 *    the original `/api/request` endpoint):
 *    - Verifies that the requested `Timeslot` is within all of the `attendee`'s
 *      availability (by reading each `attendee`'s Firestore profile document).
 *      Note that we **do not** throw an error if the sender (i.e. the tutee) is
 *      unavailable.
 *    - Verifies that the requested `subjects` are included in each of the
 *      tutors' Firestore profile documents (where a tutor is defined as an
 *      `attendee` whose `roles` include `tutor`).
 *    - Verifies that the parent (the owner of the given `uid`) is actually the
 *      pupil's parent (i.e. the `attendee`s who have the `pupil` role all
 *      include the given `uid` in their profile's `parents` field).
 * 4. Deletes the old `request` documents.
 * 5. Creates a new `appt` document containing the request body in each of the
 *    `attendee`'s Firestore `appts` subcollection.
 * 6. Updates each `attendee`'s availability (in their Firestore profile
 *    document) to reflect this appointment (i.e. remove the appointment's
 *    `time` from their availability).
 * 7. Sends each of the `appt`'s `attendee`'s an email containing instructions
 *    for how to access their Bramble virtual-tutoring room.
 *
 * @param {string} request - The path of the pending tutoring lesson's Firestore
 * document to approve (e.g. `partitions/default/users/MKroB319GCfMdVZ2QQFBle8GtCZ2/requests/CEt4uGqTtRg17rZamCLC`).
 * @param {string} uid - The user ID of the parent approving the lesson request
 * (e.g. `MKroB319GCfMdVZ2QQFBle8GtCZ2`).
 *
 * @todo Is it really required that we have the parent's user ID? Right now, we
 * only allow pupils to add the contact information of one parent. And we don't
 * really care **which** parent approves the lesson request anyways.
 */
export default async function appt(
  req: NextApiRequest,
  res: NextApiResponse<ApiError | { appt: ApptJSONInterface }>
): Promise<void> {
  /* eslint-disable @typescript-eslint/no-unsafe-member-access */
  // 1. Verify that the request body is valid.
  function error(msg: string, code = 400, err?: Error): void {
    console.error(`[ERROR] Sending client ${code} with msg (${msg})...`, err);
    res.status(code).json({ msg, ...(err || {}) });
  }
  if (!req.body) {
    error('You must provide a request body.');
  } else if (!req.body.request || typeof req.body.request !== 'string') {
    error('Your request body must contain a request field.');
  } else if (!req.body.uid || typeof req.body.uid !== 'string') {
    error('Your request body must contain a uid field.');
  } else {
    // 2. Fetch the lesson request data.
    let ref: DocumentReference | null = null;
    let db: DocumentReference | null = null;
    try {
      ref = firestore.doc(req.body.request);
      // Partition is 4th parent (e.g. `/test/users/PUPIL-DOC/requests/DOC`).
      db = (((ref.parent as CollectionReference).parent as DocumentReference)
        .parent as CollectionReference).parent;
      if (!db) throw new Error('Database partition did not exist.');
    } catch (err) {
      error('You must provide a valid request document path.', 400, err);
    }
    if (!db || !ref) {
      // Don't do anything b/c we already sent an error code to the client.
    } else {
      const doc: DocumentSnapshot = await ref.get();
      if (!doc.exists) {
        error(
          'This pending lesson request no longer exists (it was probably ' +
            'already approved).'
        );
      } else {
        // 3. Perform verifications.
        const appt: Appt = Appt.fromFirestore(doc);
        // The Firestore path in `req.body.request` is the path of the parent's
        // child's document (i.e. the request document nested under that child's
        // profile document).
        const pupilUID: string = ((doc.ref.parent as CollectionReference)
          .parent as DocumentReference).id;
        let attendeesIncludePupil = false;
        let pupilIsParentsChild = false;
        let errored = false;
        const attendees: UserWithRoles[] = [];
        await Promise.all(
          appt.attendees.map(async (attendee) => {
            // 3. Verify that the attendees have uIDs.
            if (!attendee.uid) {
              error('All attendees must have valid uIDs.');
              errored = false;
              return;
            }
            const ref: DocumentReference = (db as DocumentReference)
              .collection('users')
              .doc(attendee.uid);
            const doc: DocumentSnapshot = await ref.get();
            // 3. Verify that the attendees exist.
            if (!doc.exists) {
              error(`Attendee (${attendee.uid}) does not exist.`);
              errored = false;
              return;
            }
            const user: User = User.fromFirestore(doc);
            if (user.uid === pupilUID) {
              // 3. Verify that the pupil is among the appointment's attendees.
              attendeesIncludePupil = true;
              // 3. Verify that the pupil is the parent's child.
              if (user.parents.indexOf(req.body.uid) < 0) {
                error(
                  `${user.toString()} is not (${
                    req.body.uid as string
                  })'s child.`
                );
              } else {
                pupilIsParentsChild = true;
              }
            }
            // 3. Verify the tutors can teach the requested subjects.
            const isTutor: boolean = attendee.roles.indexOf('tutor') >= 0;
            const isMentor: boolean = attendee.roles.indexOf('mentor') >= 0;
            const canTutorSubject: (s: string) => boolean = (
              subject: string
            ) => {
              return user.tutoring.subjects.includes(subject);
            };
            const canMentorSubject: (s: string) => boolean = (
              subject: string
            ) => {
              return user.mentoring.subjects.includes(subject);
            };
            if (isTutor && !appt.subjects.every(canTutorSubject)) {
              error(
                `${user.toString()}) cannot tutor for the appted subjects.`
              );
              errored = false;
              return;
            }
            if (isMentor && !appt.subjects.every(canMentorSubject)) {
              error(
                `${user.toString()}) cannot mentor for the appted subjects.`
              );
              errored = false;
              return;
            }
            // 3. Verify that the tutor and mentor attendees are available.
            if (
              appt.time &&
              (isTutor || isMentor) &&
              !user.availability.contains(appt.time)
            ) {
              error(
                `${user.toString()} is not available on ${appt.time.toString()}.`
              );
              errored = false;
              return;
            }
            (user as UserWithRoles).roles = attendee.roles;
            attendees.push(user as UserWithRoles);
          })
        );
        if (errored) {
          // Don't do anything b/c we already sent an error code to the client.
        } else if (!pupilIsParentsChild) {
          // Don't do anything b/c we already sent an error code to the client.
        } else if (!attendeesIncludePupil) {
          error(`Parent's pupil (${pupilUID}) must attend the appointment.`);
        } else {
          console.log(`[DEBUG] Creating appt (${appt.id as string})...`);
          await Promise.all(
            attendees.map(async (attendee: UserWithRoles) => {
              if (
                attendee.roles.indexOf('tutee') >= 0 ||
                attendee.roles.indexOf('mentee') >= 0
              ) {
                // 4. Delete the old request documents.
                await (attendee.ref as DocumentReference)
                  .collection('requests')
                  .doc(appt.id as string)
                  .delete();
              }
              // 5. Create the appointment Firestore document.
              await (attendee.ref as DocumentReference)
                .collection('appts')
                .doc(appt.id as string)
                .set(appt.toFirestore());
              // 6. Update the attendees availability.
              if (appt.time) attendee.availability.remove(appt.time);
              await (attendee.ref as DocumentReference).update(
                attendee.toFirestore()
              );
            })
          );
          // 7. Send out the invitation email to the attendees.
          await sendApptEmails(appt, attendees);
          res.status(201).json({ appt: appt.toJSON() });
          console.log(
            `[DEBUG] Created appt (${appt.id as string}) and sent emails.`
          );
        }
      }
    }
  }
  /* eslint-enable @typescript-eslint/no-unsafe-member-access */
}
