import { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import { RRule } from 'rrule';

import {
  Meeting,
  MeetingAction,
  MeetingJSON,
  isMeetingJSON,
} from 'lib/model/meeting';
import { Timeslot } from 'lib/model/timeslot';
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

export type UpdateMeetingRes = MeetingJSON;
export interface UpdateMeetingOptions {
  original: MeetingJSON;
  action: MeetingAction;
}

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

    // TODO: Verify the option data types just like we do for the request body.
    const options = verifyOptions<UpdateMeetingOptions>(req.body, {
      original: body.toJSON(),
      action: 'future',
    });
    const beforeUpdateStart = new Date(options.original.time.from);

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
      // User is updating a recurring meeting. We will either:
      // - Update all meetings.
      // - Only update this meeting.
      // - Update this and following meetings.
      if (options.action === 'all') {
        // Update all meetings:
        // 1. Perform the same change that the user did on this meeting instance
        //    to the parent meeting instance.
        // 2. Send the user the meeting instance they sent us.
        const change = body.time.from.valueOf() - beforeUpdateStart.valueOf();
        const from = new Date(original.time.from.valueOf() + change);
        const to = new Date(from.valueOf() + body.time.duration);
        const time = new Timeslot({ ...body.time, from, to });

        time.recur = verifyRecurIncludesTime(time);
        time.last = getLastTime(time);

        const updatedOriginal = new Meeting({ ...body, time });

        updatedOriginal.id = original.id;
        updatedOriginal.parentId = undefined;
        updatedOriginal.venue = await updateZoom(updatedOriginal, people);

        // TODO: Ensure the emails that are being sent display the time's rrule
        // in a human readable format (e.g. 'Weekly on Tuesdays 3-4pm').
        await Promise.all([
          updateMeetingDoc(updatedOriginal),
          updateMeetingSearchObj(updatedOriginal),
          sendEmails(updatedOriginal, people, updater, org),
          updatePeopleRoles(people),
        ]);

        res.status(200).json(body.toJSON());
      } else if (options.action === 'this') {
        // Update this meeting only:
        // 1. Create a new non-recurring meeting using this meeting's data.
        // 2. Add date exception to parent meeting instance.
        // 3. Send the created meeting to the client.
        body.id = '';
        body.parentId = undefined;
        body.time.recur = undefined;
        body.time.exdates = undefined;
        body.time.last = getLastTime(body.time);
        body.venue = await createZoom(body, people);

        const newMeeting = await createMeetingDoc(body);
        await createMeetingSearchObj(newMeeting);

        // TODO: Exdates have to be exact dates that would otherwise be
        // generated by the RRuleSet. This makes excluded dates re-appear when
        // the parent recurring meeting's time is changed. Instead, we want to
        // exclude all instances on a given date, regardless of exact time.
        //
        // To recreate issue:
        // 1. Create a new daily recurring meeting.
        // 2. Reschedule a single meeting instance.
        // 3. Reschedule the original recurring meeting.
        // 4. Notice how the single meeting exception disappears.
        original.time.exdates = [
          ...(original.time.exdates || []),
          beforeUpdateStart,
        ];
        original.time.last = getLastTime(original.time);
        original.venue = await updateZoom(original, people);

        await Promise.all([
          updateMeetingDoc(original),
          updateMeetingSearchObj(original),
          sendEmails(newMeeting, people, updater, org),
          updatePeopleRoles(people),
        ]);

        res.status(200).json(newMeeting.toJSON());
      } else {
        // Update this and all following meetings:
        // 1. Create a new recurring meeting using this meeting's data.
        // 2. Add 'until' to original's recur rule to exclude this meeting.
        // 3. Send the created meeting data to the client.
        body.id = '';
        body.parentId = undefined;
        body.time.recur = verifyRecurIncludesTime(body.time);
        body.time.last = getLastTime(body.time);
        body.venue = await createZoom(body, people);

        const newRecurringMeeting = await createMeetingDoc(body);
        await createMeetingSearchObj(newRecurringMeeting);

        // TODO: This `until` property should be 12am (on the original meeting
        // date) in the user's local timezone (NOT the server timezone).
        original.time.recur = RRule.optionsToString({
          ...RRule.parseString(original.time.recur),
          until: new Date(
            beforeUpdateStart.getFullYear(),
            beforeUpdateStart.getMonth(),
            beforeUpdateStart.getDate()
          ),
        });
        original.time.last = getLastTime(original.time);
        original.venue = await updateZoom(original, people);

        await Promise.all([
          updateMeetingDoc(original),
          updateMeetingSearchObj(original),
          sendEmails(newRecurringMeeting, people, updater, org),
          updatePeopleRoles(people),
        ]);

        res.status(200).json(newRecurringMeeting.toJSON());
      }
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
