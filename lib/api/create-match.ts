import { NextApiRequest, NextApiResponse } from 'next';
import { v4 as uuid } from 'uuid';
import axios, { AxiosResponse } from 'axios';
import to from 'await-to-js';
import mail from '@sendgrid/mail';
import generatePassword from 'password-generator';

import {
  Aspect,
  Org,
  Match,
  MatchJSON,
  Person,
  Role,
  Timeslot,
  User,
  UserWithRoles,
  Venue,
  JitsiVenue,
  ZoomUser,
} from 'lib/model';
import { MatchEmail } from 'lib/emails';
import Utils from 'lib/utils';

import error from './helpers/error';
import {
  DecodedIdToken,
  DocumentReference,
  DocumentSnapshot,
  auth,
  db,
} from './helpers/firebase';

mail.setApiKey(process.env.SENDGRID_API_KEY as string);

export type CreateMatchRes = MatchJSON;

// eslint-disable-next-line @typescript-eslint/require-await
async function getJitsi(matchId: string): Promise<JitsiVenue> {
  return {
    type: 'jitsi',
    url: `https://meet.jit.si/${matchId}`,
    created: new Date(),
    updated: new Date(),
  };
}

/**
 * The Zoom meeting object returned by the Zoom Create Meeting REST API.
 * @typedef {Object} ZoomMeeting
 * @see {@link https://marketplace.zoom.us/docs/api-reference/zoom-api/meetings/meetingcreate}
 */
interface ZoomMeeting {
  id: string;
  host_email: string;
  topic: string;
  type: number;
  start_time: string;
  duration: number;
  timezone: string;
  created_at: string;
  agenda: string;
  start_url: string;
  join_url: string;
  password: string;
  h323_password: string;
  pmi: number;
}

/**
 * The Zoom user object returned by the Zoom Create User REST API.
 * @see {@link https://marketplace.zoom.us/docs/api-reference/zoom-api/users/usercreate}
 */
interface ZoomUserRes {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  type: number;
}

/**
 * Takes a match and creates a recurring Zoom meeting for it by:
 * 1. TB will first try using the tutor or mentor Zoom user accounts.
 * 2. If that fails, TB will try using the student (i.e. `tutee` and `mentee`)
 *    Zoom user accounts.
 *    - TB will not attempt to use `people` who do not have any `roles` listed
 *      (as those people were likely added just because they were on an email
 *      thread with one of the tutors, mentors, or students).
 * 3. If all of that fails (i.e. there are no existing Zoom user accounts for
 *    the match's people within the match's org), TB will try to create a new
 *    Zoom user account for the match's tutor or mentor within the match's org.
 * 4. If that still fails (i.e. the org chose option two and doesn't allow TB to
 *    create new Zoom users), TB will fallback to using
 *    {@link https://jitsi.org}.
 * @todo Finish this doc-comment and actually implement this API flow.
 */
async function getZoom(match: Match, people: UserWithRoles[]): Promise<Venue> {
  const org = Org.fromFirestore(
    await db.collection('orgs').doc(match.org).get()
  );
  const aspects = new Set<Aspect>();
  const hosts = people.filter((person: UserWithRoles) => {
    if (person.roles.includes('tutor')) {
      aspects.add('tutoring');
      return true;
    }
    if (person.roles.includes('mentor')) {
      aspects.add('mentoring');
      return true;
    }
    return false;
  });
  const students = people.filter((person: UserWithRoles) => {
    if (person.roles.includes('tutee')) {
      aspects.add('tutoring');
      return true;
    }
    if (person.roles.includes('mentee')) {
      aspects.add('mentoring');
      return true;
    }
    return false;
  });

  async function createMeeting(hostId: string): Promise<ZoomMeeting> {
    // TODO: Enable orgs to configure these Zoom meeting creation settings.
    if (!org.zoom) throw new Error(`Org (${org.toString()}) missing Zoom.`);
    const [err, res] = await to<AxiosResponse<ZoomMeeting>>(
      axios({
        method: 'post',
        url: `https://api.zoom.us/users/${hostId}/meetings`,
        data: {
          topic: `${Utils.join(match.subjects)} ${Utils.join([
            ...aspects,
          ])} match`,
          type: 3, // Recurring meeting w/ no fixed time.
          password: generatePassword(10), // Passwords no longer than 10 chars.
          settings: {
            join_before_host: true, // Host may not always attend match.
            mute_upon_entry: true, // Feature that should always be enabled IMO.
            audio: 'both', // Enable both telephony and VoIP (computer audio).
            auto_recording: 'cloud', // Record meetings to Zoom cloud.
            alternative_hosts: people.map((p) => p.email).join(','),
            waiting_room: false, // People should be able to instantly join call.
            contact_name: 'Tutorbook', // Contact name for registration.
            contact_email: 'team@tutorbook.org', // Contact for registration.
          },
        },
        headers: { authorization: `Bearer ${org.zoom.token}` },
      })
    );
    if (err) throw new Error(`${err.name} creating Zoom mtg: ${err.message}`);
    return (res as AxiosResponse<ZoomMeeting>).data;
  }

  let meeting: undefined | ZoomMeeting;

  // 1. Try using the tutor and mentor Zoom users.
  // eslint-disable-next-line no-restricted-syntax
  for (const host of hosts) {
    // eslint-disable-next-line no-await-in-loop
    const [err, mtg] = await to<ZoomMeeting>(createMeeting(host.email));
    if (err) {
      console.warn(
        `[WARNING] Host (${host.toString()}) doesn't have Zoom user within ` +
          `org (${org.toString()}) Zoom account.`
      );
    } else {
      meeting = mtg;
      break;
    }
  }

  if (!meeting) {
    // 2. Try using the student Zoom users.
    // eslint-disable-next-line no-restricted-syntax
    for (const student of students) {
      // eslint-disable-next-line no-await-in-loop
      const [err, mtg] = await to<ZoomMeeting>(createMeeting(student.email));
      if (err) {
        console.warn(
          `[WARNING] Student (${student.toString()}) doesn't have a Zoom ` +
            `user within org (${org.toString()}) Zoom account.`
        );
      } else {
        meeting = mtg;
        break;
      }
    }
  }

  async function createUser(user: UserWithRoles): Promise<ZoomUser> {
    // TODO: Enable orgs to configure these Zoom user creation settings.
    const [err, res] = await to<AxiosResponse<ZoomUserRes>>(
      axios({
        method: 'post',
        url: 'https://api.zoom.us/users',
        data: {
          action: 'create', // Sends user an invitation email to join org's Zoom.
          user_info: {
            type: 1, // Creates basic user w/out a paid license.
            email: user.email,
            first_name: user.firstName,
            last_name: user.lastName,
          },
        },
      })
    );
    if (err) throw new Error(`${err.name} creating Zoom user: ${err.message}`);
    const { data } = res as AxiosResponse<ZoomUserRes>;
    const zoomUser: ZoomUser = {
      org: org.id,
      id: data.id,
      email: data.email,
      created: new Date(),
      updated: new Date(),
    };
    await db
      .collection('users')
      .doc(user.id)
      .update({
        zooms: [...user.zooms, zoomUser],
      });
    return zoomUser;
  }

  if (!meeting) {
    // 3. Create a new Zoom user for the tutor or mentor.
    // eslint-disable-next-line no-restricted-syntax
    for (const host of hosts) {
      // eslint-disable-next-line no-await-in-loop
      const [err, user] = await to<ZoomUser>(createUser(host));
      if (err) {
        console.warn(
          `[WARNING] ${err.name} creating Zoom user (${host.toString()}) ` +
            `within org (${org.toString()}) Zoom account: ${err.message}`
        );
      } else {
        const { id: hostId } = user as ZoomUser;
        // eslint-disable-next-line no-await-in-loop, no-shadow
        const [err, mtg] = await to<ZoomMeeting>(createMeeting(hostId));
        if (err) {
          console.warn(
            `[WARNING] ${err.name} creating Zoom meeting: ${err.message}`
          );
        } else {
          meeting = mtg;
          break;
        }
      }
    }
  }

  // 4. Fallback to using Jitsi.
  if (!meeting) return getJitsi(match.id);

  return {
    type: 'zoom',
    id: meeting.id,
    url: meeting.join_url,
    invite: '',
    created: new Date(meeting.created_at),
    updated: new Date(meeting.created_at),
  };
}

/**
 * Takes an `MatchJSON` object, an authentication token, and:
 * 1. Performs the following verifications (sends a `400` error code and an
 *    accompanying human-readable error message if any of them fail):
 *    - Verifies the correct request body was sent (e.g. all parameters are there
 *      and are all of the correct types).
 *    - Verifies that the requested `Timeslot` is within all of the `person`'s
 *      availability (by reading each `person`'s Firestore profile document).
 *      Note that we **do not** throw an error if it is the request sender who
 *      is unavailable.
 *    - Verifies that the requested `subjects` are included in each of the
 *      tutors' Firestore profile documents (where a tutor is defined as an
 *      `person` whose `roles` include `tutor`).
 *    - Verifies that the given authentication JWT belongs to either an admin of
 *      orgs that all the tutees and mentees are a part of or the parent of all
 *      the tutees and mentees. In the future, teachers will also be able to
 *      create matches on behalf of their students and students will be able to
 *      add fellow students (i.e. students within the same org) to their matches.
 * 2. Adds all the tutee and mentee parents as people.
 * 3. Creates a recurring (non-scheduled) Zoom meeting and adds it as a venue to
 *    the match.
 * 4. Creates a new `matches` document.
 * 5. Sends an email initializing communications btwn the creator and the tutor.
 *
 * @param {MatchJSON} request - The match to create a pending request for.
 * The given `idToken` **must** be from one of the match's `people`
 * (see the above description for more requirements).
 * @return {MatchJSON} The created request (typically this is exactly the same as
 * the given `request` but it can be different if the server implements
 * different validations than the client).
 */
export default async function createMatch(
  req: NextApiRequest,
  res: NextApiResponse<CreateMatchRes>
): Promise<void> {
  /* eslint-disable @typescript-eslint/no-unsafe-member-access */
  // 1. Verify that the request body is valid.
  console.log('[DEBUG] Verifying request body and authentication JWT...');
  if (!req.body) {
    error(res, 'You must provide a request body.');
  } else if (!req.body.subjects || !req.body.subjects.length) {
    error(res, 'Your match must contain valid subjects.');
  } else if (!req.body.people || req.body.people.length < 2) {
    error(res, 'Your match must have >= 2 people.');
  } else if (req.body.time && typeof req.body.time !== 'object') {
    error(res, 'Your match had an invalid time.');
  } else if (
    req.body.time &&
    new Date(req.body.time.from).toString() === 'Invalid Date'
  ) {
    error(res, 'Your match had an invalid start time.');
  } else if (
    req.body.time &&
    new Date(req.body.time.to).toString() === 'Invalid Date'
  ) {
    error(res, 'Your match had an invalid end time.');
  } else if (!req.headers.authorization) {
    error(res, 'You must provide a valid Firebase Auth JWT.', 401);
  } else {
    const [err, token] = await to<DecodedIdToken>(
      auth.verifyIdToken(req.headers.authorization.replace('Bearer ', ''), true)
    );
    if (err) {
      error(res, `Your Firebase Auth JWT is invalid: ${err.message}`, 401, err);
    } else {
      const match: Match = Match.fromJSON(req.body);
      const people: UserWithRoles[] = [];
      const parents: User[] = [];
      let errored = false;
      let creator = new User({
        id: (token as DecodedIdToken).uid,
        email: (token as DecodedIdToken).email,
        photo: (token as DecodedIdToken).picture,
        phone: (token as DecodedIdToken).phone_number,
      });
      if (creator.id !== match.creator.id) {
        const msg =
          `Authentication JWT (${creator.id}) did not belong to the listed ` +
          `match creator (${match.creator.id}).`;
        error(res, msg, 401);
      } else {
        await Promise.all(
          match.people.map(async (person: Person) => {
            if (errored) return;
            // 1. Verify that the people have uIDs.
            if (!person.id) {
              error(res, 'All people must have valid uIDs.');
              errored = true;
              return;
            }
            const personRef: DocumentReference = db
              .collection('users')
              .doc(person.id);
            const personDoc: DocumentSnapshot = await personRef.get();
            // 1. Verify that the people exist.
            if (!personDoc.exists) {
              error(res, `Person (${person.id}) does not exist.`);
              errored = true;
              return;
            }
            const user: User = User.fromFirestore(personDoc);
            // 1. Verify that the match creator is an person.
            if (user.id === creator.id) creator = new User({ ...user });
            // 1. Verify that the people are available (note that we don't throw
            // an error if it is the request sender who is unavailable).
            let timeslot = 'during match time';
            if (
              match.times &&
              !match.times.every((time: Timeslot) => {
                timeslot = time.toString();
                return user.availability.contains(time);
              })
            ) {
              if (person.id === creator.id) {
                console.warn(`[WARNING] Creator unavailable ${timeslot}.`);
              } else {
                error(res, `${user.toString()} unavailable ${timeslot}.`);
                errored = true;
                return;
              }
            }
            // 1. Verify the tutors can teach the requested subjects.
            const isTutor: boolean = person.roles.indexOf('tutor') >= 0;
            const isMentor: boolean = person.roles.indexOf('mentor') >= 0;
            const canTutorSubject: (s: string) => boolean = (s: string) => {
              return user.tutoring.subjects.includes(s);
            };
            const canMentorSubject: (s: string) => boolean = (s: string) => {
              return user.mentoring.subjects.includes(s);
            };
            if (isTutor && !match.subjects.every(canTutorSubject)) {
              error(res, `${user.toString()} cannot tutor these subjects.`);
              errored = true;
              return;
            }
            if (isMentor && !match.subjects.every(canMentorSubject)) {
              error(res, `${user.toString()} cannot mentor these subjects.`);
              errored = true;
              return;
            }
            (user as UserWithRoles).roles = person.roles;
            people.push(user as UserWithRoles);
            // 2. Add all mentee and tutee parents as people.
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
          match.people.push({ roles, id: parent.id, handle: uuid() });
          const parentWithRoles = parent as UserWithRoles;
          parentWithRoles.roles = roles;
          people.push(parentWithRoles);
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
          // - The creator of the match (i.e. the owner of the JWT).
          // - The children of the creator (i.e. the creator is their parent).
          // - Part of an org that the creator is an admin of.
          const errorMsg =
            `Creator (${creator.toString()}) is not authorized to create ` +
            `matches for these people.`;
          if (
            !people.every((a: UserWithRoles) => {
              if (a.roles.every((r) => ['tutee', 'mentee'].indexOf(r) < 0))
                return true;
              if (a.id === creator.id) return true;
              if (a.parents.indexOf(creator.id) >= 0) return true;
              if (a.orgs.some((id) => orgIds.indexOf(id) >= 0)) return true;
              return false;
            })
          )
            return error(res, errorMsg, 401);
          match.id = db.collection('matches').doc().id;

          // 3. Create recurring (non-scheduled) Zoom meeting venue.
          console.log('[DEBUG] Creating Zoom meeting...');
          const [errr, venue] = await to(getZoom(match, people));
          if (errr) return error(res, errr.message, 500, errr);
          match.venue = venue as Venue;

          console.log(`[DEBUG] Creating match (${match.id})...`);
          await db.collection('matches').doc(match.id).set(match.toFirestore());

          // 4-5. Send out the match email.
          console.log('[DEBUG] Sending match email...');
          const [mailErr] = await to(
            mail.send(new MatchEmail(match, people, creator))
          );
          if (mailErr) {
            const msg = `${mailErr.name} sending email: ${mailErr.message}`;
            error(res, msg, 500, mailErr);
          } else {
            res.status(201).json(match.toJSON());
            console.log('[DEBUG] Created match and sent email.');
          }
        }
      }
    }
  }
  /* eslint-enable @typescript-eslint/no-unsafe-member-access */
}
