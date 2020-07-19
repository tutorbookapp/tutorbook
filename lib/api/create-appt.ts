import { NextApiRequest, NextApiResponse } from 'next';
import { ApptEmail } from 'lib/emails';
import { Attendee, User, UserWithRoles, Appt, ApptJSON } from 'lib/model';

import to from 'await-to-js';
import mail from '@sendgrid/mail';
import error from './helpers/error';

import {
  db,
  auth,
  DecodedIdToken,
  DocumentSnapshot,
  DocumentReference,
} from './helpers/firebase';

mail.setApiKey(process.env.SENDGRID_API_KEY as string);

export type CreateApptRes = ApptJSON;

/**
 * Takes an `ApptJSON` object, an authentication token, and:
 * 1. Performs the following verifications (sends a `400` error code and an
 *    accompanying human-readable error message if any of them fail):
 *    - Verifies the correct request body was sent (e.g. all parameters are there
 *      and are all of the correct types).
 *    - Verifies that the requested `Timeslot` is within all of the `attendee`'s
 *      availability (by reading each `attendee`'s Firestore profile document).
 *      Note that we **do not** throw an error if it is the request sender who
 *      is unavailable.
 *    - Verifies that the requested `subjects` are included in each of the
 *      tutors' Firestore profile documents (where a tutor is defined as an
 *      `attendee` whose `roles` include `tutor`).
 *    - Verifies that the given authentication JWT belongs to either an admin of
 *      orgs that all the tutees and mentees are a part of or the parent of all
 *      the tutees and mentees. In the future, teachers will also be able to
 *      create appts on behalf of their students and students will be able to
 *      add fellow students (i.e. students within the same org) to their appts.
 * 2. Creates [the Bramble tutoring lesson room]{@link https://about.bramble.io/api.html}
 *    (so that the parent can preview the venue that their child will be using
 *    to connect with their tutor).
 * 3. Creates a new `request` document containing the given `appt`'s data in the
 *    pupil's (the owner of the given JWT `token`) Firestore sub-collections.
 * 4. Sends an email to the tutee's parent(s) asking for parental approval of
 *    the tutoring match.
 * 5. Sends an email to the pupil (the sender of the lesson request) telling
 *    them that we're awaiting parental approval.
 *
 * @param {ApptJSON} request - The appointment to create a pending request for.
 * The given `idToken` **must** be from one of the appointment's `attendees`
 * (see the above description for more requirements).
 * @return {ApptJSON} The created request (typically this is exactly the same as
 * the given `request` but it can be different if the server implements
 * different validations than the client).
 */
export default async function createAppt(
  req: NextApiRequest,
  res: NextApiResponse<CreateApptRes>
): Promise<void> {
  /* eslint-disable @typescript-eslint/no-unsafe-member-access */
  // 1. Verify that the request body is valid.
  console.log('[DEBUG] Verifying request body and authentication JWT...');
  if (!req.body) {
    error(res, 'You must provide a request body.');
  } else if (!req.body.subjects || !req.body.subjects.length) {
    error(res, 'Your appointment must contain valid subjects.');
  } else if (!req.body.attendees || req.body.attendees.length < 2) {
    error(res, 'Your appointment must have >= 2 attendees.');
  } else if (req.body.time && typeof req.body.time !== 'object') {
    error(res, 'Your appointment had an invalid time.');
  } else if (
    req.body.time &&
    new Date(req.body.time.from).toString() === 'Invalid Date'
  ) {
    error(res, 'Your appointment had an invalid start time.');
  } else if (
    req.body.time &&
    new Date(req.body.time.to).toString() === 'Invalid Date'
  ) {
    error(res, 'Your appointment had an invalid end time.');
  } else if (!req.headers.authorization) {
    error(res, 'You must provide a valid Firebase Auth JWT.', 401);
  } else {
    const [err, token] = await to<DecodedIdToken>(
      auth.verifyIdToken(req.headers.authorization.replace('Bearer ', ''), true)
    );
    if (err) {
      error(res, `Your Firebase Auth JWT is invalid: ${err.message}`, 401, err);
    } else {
      const appt: Appt = Appt.fromJSON(req.body);
      const attendees: UserWithRoles[] = [];
      let errored = false;
      let creator = new User({
        id: (token as DecodedIdToken).uid,
        email: (token as DecodedIdToken).email,
        photo: (token as DecodedIdToken).picture,
        phone: (token as DecodedIdToken).phone_number,
      });
      await Promise.all(
        appt.attendees.map(async (attendee: Attendee) => {
          if (errored) return;
          // 1. Verify that the attendees have uIDs.
          if (!attendee.id) {
            error(res, 'All attendees must have valid uIDs.');
            errored = true;
            return;
          }
          const attendeeRef: DocumentReference = db
            .collection('users')
            .doc(attendee.id);
          const attendeeDoc: DocumentSnapshot = await attendeeRef.get();
          // 1. Verify that the attendees exist.
          if (!attendeeDoc.exists) {
            error(res, `Attendee (${attendee.id}) does not exist.`);
            errored = true;
            return;
          }
          const user: User = User.fromFirestore(attendeeDoc);
          // 1. Verify that the appointment creator is an attendee.
          if (user.id === creator.id) creator = new User({ ...user });
          // 1. Verify that the attendees are available (note that we don't throw
          // an error if it is the request sender who is unavailable).
          if (appt.time && !user.availability.contains(appt.time)) {
            const timeslot: string = appt.time.toString();
            if (attendee.id === creator.id) {
              console.warn(`[WARNING] Creator unavailable ${timeslot}.`);
            } else {
              error(res, `${user.toString()} unavailable ${timeslot}.`);
              errored = true;
              return;
            }
          }
          // 1. Verify the tutors can teach the requested subjects.
          const isTutor: boolean = attendee.roles.indexOf('tutor') >= 0;
          const isMentor: boolean = attendee.roles.indexOf('mentor') >= 0;
          const canTutorSubject: (s: string) => boolean = (s: string) => {
            return user.tutoring.subjects.includes(s);
          };
          const canMentorSubject: (s: string) => boolean = (s: string) => {
            return user.mentoring.subjects.includes(s);
          };
          if (isTutor && !appt.subjects.every(canTutorSubject)) {
            error(res, `${user.toString()} cannot tutor these subjects.`);
            errored = true;
            return;
          }
          if (isMentor && !appt.subjects.every(canMentorSubject)) {
            error(res, `${user.toString()} cannot mentor these subjects.`);
            errored = true;
            return;
          }
          (user as UserWithRoles).roles = attendee.roles;
          attendees.push(user as UserWithRoles);
        })
      );
      if (errored) {
        // Don't do anything b/c we already sent an error code to the client.
      } else if (!creator.name) {
        error(res, `Creator (${creator.id}) must attend the appointment.`);
      } else {
        const orgIds: string[] = (
          await db
            .collection('orgs')
            .where('members', 'array-contains', creator.id)
            .get()
        ).docs.map((org: DocumentSnapshot) => org.id);
        // 1. Verify that all the tutees and mentees are either:
        // - The creator of the appt (i.e. the owner of the JWT).
        // - The children of the creator (i.e. the creator is their parent).
        // - Part of an org that the creator is an admin of.
        if (
          !attendees.every((attendee: UserWithRoles) => {
            if (
              attendee.roles.every(
                (role: string) => ['tutee', 'mentee'].indexOf(role) < 0
              )
            )
              return true;
            if (attendee.id === creator.id) return true;
            if (attendee.parents.indexOf(creator.id) >= 0) return true;
            if (attendee.orgs.some((id) => orgIds.indexOf(id) >= 0))
              return true;
            return false;
          })
        )
          return error(
            res,
            `Creator (${creator.toString()}) cannot create appointments for these attendees.`,
            401
          );
        appt.id = db.collection('appts').doc().id;
        console.log(`[DEBUG] Creating appointment (${appt.id})...`);
        await db.collection('appts').doc(appt.id).set(appt.toFirestore());
        // 4-5. Send out the appointment email.
        console.log('[DEBUG] Sending appointment email...');
        const [mailErr] = await to(
          mail.send(new ApptEmail(appt, attendees, creator))
        );
        if (mailErr) {
          const msg = `${mailErr.name} sending email: ${mailErr.message}`;
          error(res, msg, 500, mailErr);
        } else {
          res.status(201).json(appt.toJSON());
          console.log('[DEBUG] Created appointment and sent email.');
        }
      }
    }
  }
  /* eslint-enable @typescript-eslint/no-unsafe-member-access */
}
