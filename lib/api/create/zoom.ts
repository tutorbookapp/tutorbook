// TODO: Refactor this file (it's much too long right now for an API component)
// and make `createZoom` throw `APIError`s.

import axios, { AxiosResponse } from 'axios';
import generatePassword from 'password-generator';
import to from 'await-to-js';

import { Aspect, Match, Org, User, Venue, ZoomUser } from 'lib/model';
import { db } from 'lib/api/firebase';
import { join } from 'lib/utils';

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
export default async function createZoom(
  match: Match,
  people: User[]
): Promise<Venue> {
  const org = Org.fromFirestore(
    await db.collection('orgs').doc(match.org).get()
  );
  const aspects = new Set<Aspect>();
  const hosts = people.filter((person: User) => {
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
  const students = people.filter((person: User) => {
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
          topic: `${join(match.subjects)} ${join([...aspects])} match`,
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

  async function createUser(user: User): Promise<ZoomUser> {
    // TODO: Enable orgs to configure these Zoom user creation settings.
    const [err, res] = await to<AxiosResponse<ZoomUserRes>>(
      axios({
        method: 'post',
        url: 'https://api.zoom.us/users',
        data: {
          action: 'create', // Sends user invitation email to join org's Zoom.
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
    const zoomUser = new ZoomUser({
      org: org.id,
      id: data.id,
      email: data.email,
    });
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
  if (!meeting) return new Venue();

  return new Venue({
    type: 'zoom',
    id: meeting.id,
    url: meeting.join_url,
    invite: '',
    created: new Date(meeting.created_at),
    updated: new Date(meeting.created_at),
  });
}
