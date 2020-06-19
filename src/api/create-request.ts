import { ClientResponse } from '@sendgrid/client/src/response';
import { ResponseError } from '@sendgrid/helpers/classes';
import { NextApiRequest, NextApiResponse } from 'next';
import axios, { AxiosResponse, AxiosPromise } from 'axios';
import { PupilRequestEmail, ParentRequestEmail } from '@tutorbook/emails';
import { User, UserWithRoles, Appt, ApptJSONInterface } from '@tutorbook/model';

import to from 'await-to-js';
import mail from '@sendgrid/mail';
import error from './error';

import {
  db,
  auth,
  DecodedIdToken,
  DocumentSnapshot,
  DocumentReference,
} from './firebase';

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
  }) as AxiosPromise<BrambleRes>;
}

/**
 * Sends out two types of emails:
 * 1. Email to the tutee attendees's parents asking for parental approval of the
 * tutoring match (the attendees are not sent the link to the Bramble room until
 * **after** we receive parental consent).
 * 2. Email to the tutee and mentee attendees letting them know that we've
 * received their request and are awaiting parental approval.
 * @todo Give the tutees an option to change their parent's contact info in
 * that second email (i.e. you might have entered fake stuff just to see search
 * results and now you can't do anything because those parental emails aren't
 * going where they should be).
 */
async function sendRequestEmails(
  request: Appt,
  attendees: ReadonlyArray<UserWithRoles>
): Promise<void> {
  await Promise.all(
    attendees.map(async (pupil: UserWithRoles) => {
      if (pupil.roles.indexOf('tutee') < 0 && pupil.roles.indexOf('mentee') < 0)
        return;
      if (pupil.roles.indexOf('tutee') >= 0) {
        await Promise.all(
          pupil.parents.map(async (parentUID: string) => {
            const parentDoc: DocumentSnapshot = await db
              .collection('users')
              .doc(parentUID)
              .get();
            if (parentDoc.exists) {
              const parent: User = User.fromFirestore(parentDoc);
              /* eslint-disable @typescript-eslint/ban-types */
              const [err] = await to<
                [ClientResponse, {}],
                Error | ResponseError
              >(
                /* eslint-enable @typescript-eslint/ban-types */
                mail.send(
                  new ParentRequestEmail(parent, pupil, request, attendees)
                )
              );
              if (err) {
                console.error(
                  `[ERROR] ${err.name} sending ${parent.name} <${parent.email}> ` +
                    `the parent pending lesson request (${
                      request.id as string
                    }) email:`,
                  err
                );
              } else {
                console.log(
                  `[DEBUG] Sent ${parent.name} <${parent.email}> the parent ` +
                    `pending lesson request (${request.id as string}) email.`
                );
              }
            } else {
              console.warn(`[WARNING] Parent (${parentUID}) did not exist.`);
            }
          })
        );
      }
      /* eslint-disable-next-line @typescript-eslint/ban-types */
      const [err] = await to<[ClientResponse, {}], Error | ResponseError>(
        mail.send(new PupilRequestEmail(pupil, request, attendees))
      );
      if (err) {
        console.error(
          `[ERROR] ${err.name} sending ${pupil.name} <${pupil.email}> the ` +
            `pending request (${request.id as string}) email:`,
          err
        );
      } else {
        console.log(
          `[DEBUG] Sent ${pupil.name} <${pupil.email}> the pending request ` +
            `(${request.id as string}) email.`
        );
      }
    })
  );
}

export type CreateRequestRes = ApptJSONInterface;

/**
 * Takes an `ApptJSONInterface` object, an authentication token, and:
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
 *    - Verifies that the given `token` belongs to one of the `appt`'s
 *      `attendees`.
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
 * @param {string} token - A valid Firebase Authentication JWT `idToken` to
 * authorize the request. You're able to get this token by calling the `user`
 * REST API endpoint (an endpoint that will create a new user and give you a
 * `customToken` to sign-in with).
 * @param {ApptJSONInterface} request - The appointment to create a pending
 * request for. The given `idToken` **must** be from one of the appointment's
 * `attendees` (see the above description for more requirements).
 */
export default async function createRequest(
  req: NextApiRequest,
  res: NextApiResponse<CreateRequestRes>
): Promise<void> {
  /* eslint-disable @typescript-eslint/no-unsafe-member-access */
  // 1. Verify that the request body is valid.
  if (!req.body) {
    error(res, 'You must provide a request body.');
  } else if (typeof req.body.request !== 'object') {
    error(res, 'Your request body must contain a user field.');
  } else if (!req.body.request.subjects || !req.body.request.subjects.length) {
    error(res, 'Your appointment must contain valid subjects.');
  } else if (
    !req.body.request.attendees ||
    req.body.request.attendees.length < 2
  ) {
    error(res, 'Your appointment must have >= 2 attendees.');
  } else if (typeof req.body.request.time !== 'object') {
    error(res, 'Your appointment had an invalid time.');
  } else if (
    req.body.request.time &&
    new Date(req.body.request.time.from).toString() === 'Invalid Date'
  ) {
    error(res, 'Your appointment had an invalid start time.');
  } else if (
    req.body.request.time &&
    new Date(req.body.request.time.to).toString() === 'Invalid Date'
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
      const request: Appt = Appt.fromJSON(req.body.request);
      const attendees: UserWithRoles[] = [];
      let attendeesIncludeAuthToken = false;
      let errored = false;
      await Promise.all(
        request.attendees.map(async (attendee) => {
          if (errored) return;
          // 1. Verify that the attendees have uIDs.
          if (!attendee.id) {
            error(res, 'All attendees must have valid uIDs.');
            errored = true;
            return;
          }
          if (attendee.id === (token as DecodedIdToken).uid) {
            // 1. Verify that the appointment creator is an attendee.
            attendeesIncludeAuthToken = true;
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
          // 1. Verify that the attendees are available (note that we don't throw
          // an error if it is the request sender who is unavailable).
          if (request.time && !user.availability.contains(request.time)) {
            if (attendee.id === (token as DecodedIdToken).uid) {
              console.warn(
                `[WARNING] Sender is not available on ${request.time.toString()}.`
              );
            } else {
              error(
                res,
                `${user.toString()} is not available on ${request.time.toString()}.`
              );
              errored = true;
              return;
            }
          }
          // 1. Verify the tutors can teach the requested subjects.
          const isTutor: boolean = attendee.roles.indexOf('tutor') >= 0;
          const isMentor: boolean = attendee.roles.indexOf('mentor') >= 0;
          const canTutorSubject: (s: string) => boolean = (subject: string) => {
            return user.tutoring.subjects.includes(subject);
          };
          const canMentorSubject: (s: string) => boolean = (
            subject: string
          ) => {
            return user.mentoring.subjects.includes(subject);
          };
          if (isTutor && !request.subjects.every(canTutorSubject)) {
            error(res, `${user.toString()} cannot tutor these subjects.`);
            errored = true;
            return;
          }
          if (isMentor && !request.subjects.every(canMentorSubject)) {
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
      } else if (!attendeesIncludeAuthToken) {
        error(res, `Creator (${(token as DecodedIdToken).uid}) must attend.`);
      } else {
        // 2. Create a new Bramble room for the tutoring appointment.
        request.id = (attendees[0].ref as DocumentReference)
          .collection('requests')
          .doc().id;
        console.log(`[DEBUG] Creating Bramble room (${request.id})...`);
        const [brambleErr, brambleRes] = await to<AxiosResponse<BrambleRes>>(
          createBrambleRoom(request)
        );
        if (brambleErr) {
          const msg = `${brambleErr.name} using Bramble: ${brambleErr.message}`;
          console.error(`[ERROR] ${msg}:`, brambleErr);
          error(res, msg, 500, brambleErr);
        } else {
          const brambleURL: string = (brambleRes as AxiosResponse<BrambleRes>)
            .data.result;
          request.venues.push({
            type: 'bramble',
            url: brambleURL,
            description:
              `Join your tutoring lesson via <a href="${brambleURL}">this ` +
              'Bramble room</a>. Your room will be reused weekly until your ' +
              'tutoring lesson is cancelled. To learn more about Bramble, ' +
              'head over to <a href="https://about.bramble.io/help/help-home' +
              '.html">their help center</a>.',
          });
          console.log(`[DEBUG] Creating pending request (${request.id})...`);
          await Promise.all(
            attendees.map(async (attendee: UserWithRoles) => {
              if (
                attendee.roles.indexOf('tutee') < 0 &&
                attendee.roles.indexOf('mentee') < 0
              )
                return;
              // 3. Create the appointment Firestore document.
              // TODO: Ensure that the `ref` property on this request points to
              // the correct document when creating the parent request emails.
              // It should point towards the document in the parent's child's
              // subcollections. Because we only support one-on-one tutoring
              // right now, that isn't a problem. But if there is more than one
              // tutee attendee, this will use the last one for the `ref`.
              request.ref = (attendee.ref as DocumentReference)
                .collection('requests')
                .doc(request.id as string);
              await request.ref.set(request.toFirestore());
            })
          );
          // 4-5. Send out the pending request emails.
          await sendRequestEmails(request, attendees);
          res.status(201).json(request.toJSON());
          console.log(`[DEBUG] Created pending request (${request.id}).`);
        }
      }
    }
  }
  /* eslint-enable @typescript-eslint/no-unsafe-member-access */
}
