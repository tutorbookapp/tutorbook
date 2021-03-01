import { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import { RRule } from 'rrule';

import { Meeting, MeetingJSON, isMeetingJSON } from 'lib/model';
import createMeetingDoc from 'lib/api/create/meeting-doc';
import createMeetingSearchObj from 'lib/api/create/meeting-search-obj';
import createZoom from 'lib/api/create/zoom';
import getLastTime from 'lib/api/get/last-time';
import getOrg from 'lib/api/get/org';
import getPeople from 'lib/api/get/people';
import getPerson from 'lib/api/get/person';
import { handle } from 'lib/api/error';
import sendEmails from 'lib/mail/meetings/update';
import updateMatchDoc from 'lib/api/update/match-doc';
import updateMatchSearchObj from 'lib/api/update/match-search-obj';
import updateMeetingDoc from 'lib/api/update/meeting-doc';
import updateMeetingSearchObj from 'lib/api/update/meeting-search-obj';
import updatePeopleRoles from 'lib/api/update/people-roles';
import updateZoom from 'lib/api/update/zoom';
import verifyAuth from 'lib/api/verify/auth';
import verifyBody from 'lib/api/verify/body';
import verifyDocExists from 'lib/api/verify/doc-exists';
import verifyOptions from 'lib/api/verify/options';
import verifyRecurIncludesTime from 'lib/api/verify/recur-includes-time';
import verifySubjectsCanBeTutored from 'lib/api/verify/subjects-can-be-tutored';
import verifyTimeInAvailability from 'lib/api/verify/time-in-availability';

export type UpdateMeetingOptions = { original: MeetingJSON };
export type UpdateMeetingRes = MeetingJSON;

export default async function updateMeeting(
  req: Req,
  res: Res<UpdateMeetingRes>
): Promise<void> {
  try {
    const body = verifyBody<Meeting, MeetingJSON>(
      req.body,
      isMeetingJSON,
      Meeting
    );
    const options = verifyOptions<UpdateMeetingOptions>(req.body, {
      original: body.toJSON(),
    });

    const [meetingDoc] = await Promise.all([
      verifyDocExists('meetings', body.parentId || body.id),
      verifyDocExists('matches', body.match.id),
    ]);
    const original = Meeting.fromFirestoreDoc(meetingDoc);
    const people = await getPeople(body.match.people);

    // TODO: Actually implement availability verification.
    verifyTimeInAvailability(body.time, people);
    verifySubjectsCanBeTutored(body.match.subjects, people);

    // TODO: Compare the previous data with the requested updates to ensure that
    // the people and org haven't changed (prevent check bypassing).
    const { uid } = await verifyAuth(req.headers, {
      userIds: body.match.people.map((p) => p.id),
      orgIds: [body.match.org],
    });

    const org = await getOrg(body.match.org);
    const updater = await getPerson({ id: uid }, people);

    // TODO: Certain users can update certain statuses:
    // - Admins can change 'pending' or 'logged' to 'approved'.
    // - Admins can change 'approved' to 'pending' or 'logged'.
    // - Meeting people can change 'pending' to 'logged'.

    if (original.id !== body.id && original.time.recur) {
      // User is updating a recurring meeting. By default, we only update this
      // meeting and all future meetings:
      // 1. Create a new recurring meeting using this meeting's data.
      // 2. Add 'until' to original's recur rule to exclude this meeting.
      // 3. Send the created meeting data to the client.

      body.id = '';
      body.parentId = undefined;
      body.venue = await createZoom(body, people);

      // Ensure that the `until` value isn't before the `time.from` value (which
      // would prevent *any* meeting instances from being calculated).
      body.time.recur = verifyRecurIncludesTime(body.time);
      body.time.last = getLastTime(body.time);

      const meeting = await createMeetingDoc(body);
      await createMeetingSearchObj(meeting);

      // TODO: We need to know the start date of the meeting instance before it
      // was updated. Otherwise, we can't properly exclude it from the original.
      original.time.recur = RRule.optionsToString({
        ...RRule.parseString(original.time.recur),
        until: new Date(
          new Date(options.original.time.from).getFullYear(),
          new Date(options.original.time.from).getMonth(),
          new Date(options.original.time.from).getDate()
        ),
      });
      original.time.last = getLastTime(original.time);

      await Promise.all([
        updateMeetingDoc(original),
        updateMeetingSearchObj(original),
        sendEmails(meeting, people, updater, org),
        updatePeopleRoles(people),
      ]);

      res.status(200).json(meeting.toJSON());
    } else {
      body.venue = await updateZoom(body, people);
      body.time.last = getLastTime(body.time);

      // TODO: Should I send a 200 status code *and then* send emails? Would that
      // make the front-end feel faster? Or is that a bad development practice?
      await Promise.all([
        updateMatchDoc(body.match),
        updateMatchSearchObj(body.match),
        updateMeetingDoc(body),
        updateMeetingSearchObj(body),
        sendEmails(body, people, updater, org),
        updatePeopleRoles(people),
      ]);

      res.status(200).json(body.toJSON());
    }
  } catch (e) {
    handle(e, res);
  }
}
