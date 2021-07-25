import { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import { RRule } from 'rrule';

import { MeetingAction, Meeting, meetingToSegment } from 'lib/model/meeting';
import analytics from 'lib/api/analytics';
import deleteMeetingDoc from 'lib/api/delete/meeting-doc';
import getLastTime from 'lib/api/get/last-time';
import getMeeting from 'lib/api/get/meeting';
import getMeetingVenue from 'lib/api/get/meeting-venue';
import getOrg from 'lib/api/get/org';
import getPeople from 'lib/api/get/people';
import getPerson from 'lib/api/get/person';
import { handle } from 'lib/api/error';
import logger from 'lib/api/logger';
import segment from 'lib/api/segment';
import sendEmails from 'lib/mail/meetings/delete';
import updateAvailability from 'lib/api/update/availability';
import updateMeetingDoc from 'lib/api/update/meeting-doc';
import updatePeopleTags from 'lib/api/update/people-tags';
import verifyAuth from 'lib/api/verify/auth';
import verifyOptions from 'lib/api/verify/options';
import verifyQueryId from 'lib/api/verify/query-id';

export type DeleteMeetingRes = void;
export interface DeleteMeetingOptions {
  deleting: Meeting;
  action: MeetingAction;
}

export default async function deleteMeeting(
  req: Req,
  res: Res<DeleteMeetingRes>
): Promise<void> {
  try {
    const id = verifyQueryId(req.query);
    const meeting = await getMeeting(id);

    logger.info(`Deleting ${meeting.toString()}...`);

    // TODO: Verify the option data types just like we do for the request body.
    const options = verifyOptions<DeleteMeetingOptions>(req.body, {
      deleting: meeting,
      action: 'future',
    });
    const deleting = Meeting.parse(options.deleting);

    const { uid } = await verifyAuth(req.headers, {
      userIds: meeting.match.people.map((p) => p.id),
      orgIds: [meeting.match.org],
    });

    const org = await getOrg(meeting.match.org);
    const people = await getPeople(meeting.match.people);
    const deleter = await getPerson({ id: uid }, people);

    // User is deleting a recurring meeting. We will either:
    // - Delete all meetings.
    // - Only delete this meeting.
    // - Delete this and following meetings.
    const isRecurring = meeting.time.recur && meeting.id !== deleting.id;

    if (isRecurring && options.action === 'this') {
      // Delete this meeting only:
      // 1. Add date exception to parent meeting instance.

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
      meeting.time.exdates = [
        ...(meeting.time.exdates || []),
        deleting.time.from,
      ];
      meeting.time.last = getLastTime(meeting.time);
      meeting.venue = getMeetingVenue(meeting, org, people);

      // TODO: Specify in email that this is only canceling this meeting.
      await Promise.all([
        updateMeetingDoc(meeting),
        sendEmails(deleting, people, deleter, org),
      ]);
    } else if (isRecurring && options.action === 'future') {
      // Delete this and all following meetings:
      // 1. Add 'until' to parent meeting's recur rule to exclude this meeting.

      // TODO: This `until` property should be 12am (on the original meeting
      // date) in the user's local timezone (NOT the server timezone).
      meeting.time.recur = RRule.optionsToString({
        ...RRule.parseString(meeting.time.recur as string),
        until: new Date(
          deleting.time.from.getFullYear(),
          deleting.time.from.getMonth(),
          deleting.time.from.getDate()
        ),
      });
      meeting.time.last = getLastTime(meeting.time);
      meeting.venue = getMeetingVenue(meeting, org, people);

      // TODO: Specify in email that this is canceling all following meetings.
      await Promise.all([
        updateMeetingDoc(meeting),
        sendEmails(deleting, people, deleter, org),
      ]);
    } else {
      // Delete all meetings. Identical to deleting a non-recurring meeting.
      await Promise.all([
        deleteMeetingDoc(meeting.id),
        sendEmails(meeting, people, deleter, org),
      ]);
    }

    res.status(200).end();

    logger.info(`Deleted ${deleting.toString()}.`);

    segment.track({
      userId: uid,
      event: 'Meeting Deleted',
      properties: meetingToSegment(deleting),
    });

    // TODO: Ensure that this updates the org statistics as expected (e.g. we
    // don't want to decrease the total # of meetings if only a single meeting
    // instance is deleted and it's parent recurring meeting remains).
    // TODO: We shouldn't remove the `meeting` tag from a user if they still
    // have other meetings. Perhaps calculate this using a CRON job instead.
    await Promise.all([
      analytics(deleting, 'deleted'),
      updatePeopleTags(people, { remove: ['meeting'] }),
      ...people.map((p) => updateAvailability(p)),
    ]);
  } catch (e) {
    handle(e, res);
  }
}
