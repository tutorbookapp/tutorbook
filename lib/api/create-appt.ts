import { NextApiRequest, NextApiResponse } from 'next';
import { ApptEmail } from 'lib/emails';
import {
  Venue,
  Role,
  Timeslot,
  Attendee,
  User,
  UserWithRoles,
  Appt,
  ApptJSON,
} from 'lib/model';
import { v4 as uuid } from 'uuid';

import axios, { AxiosResponse } from 'axios';
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

interface BrambleRes {
  APImethod: string;
  status: string;
  result: string;
}

async function getBramble(apptId: string): Promise<Venue> {
  const [err, res] = await to<AxiosResponse<BrambleRes>>(
    axios({
      method: 'post',
      url: 'https://api.bramble.io/createRoom',
      headers: {
        room: apptId,
        agency: 'tutorbook',
        auth_token: process.env.BRAMBLE_API_KEY as string,
      },
    })
  );
  if (err) throw new Error(`${err.name} creating Bramble room: ${err.message}`);
  return { url: (res as AxiosResponse<BrambleRes>).data.result };
}

async function getJitsi(apptId: string): Promise<Venue> {
  return { url: `https://meet.jit.si/${apptId}` };
}

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
 * 2. Adds all the tutee and mentee parents as attendees.
 * 3. Creates [a Bramble room]{@link https://about.bramble.io/api.html} and adds
 *    it as a venue to the appointment.
 * 4. Creates a new `appts` document.
 * 5. Sends an email initializing communications btwn the creator and the tutor.
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
      const parents: User[] = [];
      let errored = false;
      let creator = new User({
        id: (token as DecodedIdToken).uid,
        email: (token as DecodedIdToken).email,
        photo: (token as DecodedIdToken).picture,
        phone: (token as DecodedIdToken).phone_number,
      });
      if (creator.id !== appt.creator.id) {
        const msg =
          `Creator (${creator.id}) did not match appt creator ` +
          `(${appt.creator.id}).`;
        error(res, msg, 401);
      } else {
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
            let timeslot: string = 'during appointment time';
            if (
              appt.times &&
              !appt.times.every((time: Timeslot) => {
                timeslot = time.toString();
                return user.availability.contains(time);
              })
            ) {
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
            // 2. Add all mentee and tutee parents as attendees.
            if (!isTutor && !isMentor)
              await Promise.all(
                user.parents.map(async (id) => {
                  const doc = await db.collection('users').doc(id).get();
                  const warningMsg = `[WARNING] Parent (${id}) doesn't exist.`;
                  if (!doc.exists) console.warn(warningMsg);
                  parents.push(User.fromFirestore(doc));
                })
              );
          })
        );
        parents.forEach((parent: User) => {
          const roles: Role[] = ['parent'];
          appt.attendees.push({ roles, id: parent.id, handle: uuid() });
          const parentWithRoles = parent as UserWithRoles;
          parentWithRoles.roles = roles;
          attendees.push(parentWithRoles);
        });
        if (!errored) {
          if (!creator.name) {
            const doc = await db.collection('users').doc(creator.id).get();
            const msg = `Creator (${creator.id}) does not exist.`;
            if (!doc.exists) return error(res, msg);
            creator = User.fromFirestore(doc);
          }
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
          const errorMsg =
            `Creator (${creator.toString()}) is not authorized to create ` +
            `appointments for these attendees.`;
          if (
            !attendees.every((a: UserWithRoles) => {
              if (a.roles.every((r) => ['tutee', 'mentee'].indexOf(r) < 0))
                return true;
              if (a.id === creator.id) return true;
              if (a.parents.indexOf(creator.id) >= 0) return true;
              if (a.orgs.some((id) => orgIds.indexOf(id) >= 0)) return true;
              return false;
            })
          )
            return error(res, errorMsg, 401);
          appt.id = db.collection('appts').doc().id;
          if (appt.aspect === 'tutoring') {
            console.log('[DEBUG] Creating Bramble room...');
            const [errr, venue] = await to(getBramble(appt.id));
            if (errr) return error(res, errr.message, 500, errr);
            appt.bramble = venue;
          } else {
            console.log('[DEBUG] Creating Jitsi room...');
            const [errr, venue] = await to(getJitsi(appt.id));
            if (errr) return error(res, errr.message, 500, errr);
            appt.jitsi = venue;
          }
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
  }
  /* eslint-enable @typescript-eslint/no-unsafe-member-access */
}
