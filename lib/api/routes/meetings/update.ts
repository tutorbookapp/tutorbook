import { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import { RRule } from 'rrule';

import {
  DBMeeting,
  Meeting,
  MeetingAction,
  MeetingJSON,
  isMeetingJSON,
} from 'lib/model/meeting';
import { createMeeting, updateMeeting } from 'lib/api/db/meeting';
import { Timeslot } from 'lib/model/timeslot';
import getLastTime from 'lib/api/get/last-time';
import getMeetingVenue from 'lib/api/get/meeting-venue';
import { getOrg } from 'lib/api/db/org';
import getPeople from 'lib/api/get/people';
import getPerson from 'lib/api/get/person';
import { handle } from 'lib/api/error';
import logger from 'lib/api/logger';
import segment from 'lib/api/segment';
import sendEmails from 'lib/mail/meetings/update';
import updateMeetingTags from 'lib/api/update/meeting-tags';
import updatePeopleTags from 'lib/api/update/people-tags';
import { updateUser } from 'lib/api/db/user';
import verifyAuth from 'lib/api/verify/auth';
import verifyBody from 'lib/api/verify/body';
import verifyOptions from 'lib/api/verify/options';
import verifyRecordExists from 'lib/api/verify/record-exists';
import verifyRecurIncludesTime from 'lib/api/verify/recur-includes-time';
import verifySubjectsCanBeTutored from 'lib/api/verify/subjects-can-be-tutored';
import verifyTimeInAvailability from 'lib/api/verify/time-in-availability';

export type UpdateMeetingRes = MeetingJSON;
export interface UpdateMeetingOptions {
  original: MeetingJSON;
  action: MeetingAction;
}

export default async function updateMeetingAPI(
  req: Req,
  res: Res<UpdateMeetingRes>
): Promise<void> {
  try {
    const body = verifyBody<Meeting, MeetingJSON>(
      req.body,
      isMeetingJSON,
      Meeting
    );

    logger.info(`Updating ${body.toString()}...`);

    // TODO: Verify the option data types just like we do for the request body.
    const options = verifyOptions<UpdateMeetingOptions>(req.body, {
      original: body.toJSON(),
      action: 'future',
    });
    const beforeUpdateStart = new Date(options.original.time.from);

    const meetingRecord = await verifyRecordExists<DBMeeting>(
      'meetings',
      body.parentId || body.id
    );
    const original = Meeting.fromDB(meetingRecord);
    const people = await getPeople(body.people);

    // TODO: Actually implement availability verification.
    verifyTimeInAvailability(body.time, people);
    verifySubjectsCanBeTutored(body.subjects, people);

    // TODO: Compare the previous data with the requested updates to ensure that
    // the people and org haven't changed (prevent check bypassing).
    const { uid } = await verifyAuth(req.headers, {
      userIds: body.people.map((p) => p.id),
      orgIds: [body.org],
    });

    const org = await getOrg(body.org);
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
        updatedOriginal.venue = getMeetingVenue(updatedOriginal, org, people);

        const withTagsUpdate = updateMeetingTags(updatedOriginal);

        // TODO: Ensure the emails that are being sent display the time's rrule
        // in a human readable format (e.g. 'Weekly on Tuesdays 3-4pm').
        await Promise.all([
          updateMeeting(withTagsUpdate),
          sendEmails(withTagsUpdate, people, updater, org),
        ]);

        res.status(200).json(body.toJSON());

        logger.info(`Updated ${body.toString()}.`);

        segment.track({
          userId: uid,
          event: 'Meeting Updated',
          properties: body.toSegment(),
        });

        await Promise.all([
          updatePeopleTags(people, { add: ['meeting'] }),
          Promise.all(people.map((p) => updateUser(p))),
        ]);
      } else if (options.action === 'this') {
        // Update this meeting only:
        // 1. Create a new non-recurring meeting using this meeting's data.
        // 2. Add date exception to parent meeting instance.
        // 3. Send the created meeting to the client.
        body.id = 0;
        body.parentId = undefined;
        body.time.recur = undefined;
        body.time.exdates = undefined;
        body.time.last = getLastTime(body.time);
        body.venue = getMeetingVenue(body, org, people);

        const withTagsUpdate = updateMeetingTags(body);
        const newMeeting = await createMeeting(withTagsUpdate);

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
        original.venue = getMeetingVenue(original, org, people);

        const originalWithTagsUpdate = updateMeetingTags(original);

        await Promise.all([
          updateMeeting(originalWithTagsUpdate),
          sendEmails(newMeeting, people, updater, org),
        ]);

        res.status(200).json(newMeeting.toJSON());

        logger.info(`Updated ${newMeeting.toString()}.`);

        segment.track({
          userId: uid,
          event: 'Meeting Updated',
          properties: newMeeting.toSegment(),
        });

        await Promise.all([
          updatePeopleTags(people, { add: ['meeting'] }),
          Promise.all(people.map((p) => updateUser(p))),
        ]);
      } else {
        // Update this and all following meetings:
        // 1. Create a new recurring meeting using this meeting's data.
        // 2. Add 'until' to original's recur rule to exclude this meeting.
        // 3. Send the created meeting data to the client.
        body.id = 0;
        body.parentId = undefined;
        body.time.recur = verifyRecurIncludesTime(body.time);
        body.time.last = getLastTime(body.time);
        body.venue = getMeetingVenue(body, org, people);

        const withTagsUpdate = updateMeetingTags(body);
        const newRecurringMeeting = await createMeeting(withTagsUpdate);

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
        original.venue = getMeetingVenue(original, org, people);

        const originalWithTagsUpdate = updateMeetingTags(original);

        await Promise.all([
          updateMeeting(originalWithTagsUpdate),
          sendEmails(newRecurringMeeting, people, updater, org),
        ]);

        res.status(200).json(newRecurringMeeting.toJSON());

        logger.info(`Updated ${newRecurringMeeting.toString()}.`);

        segment.track({
          userId: uid,
          event: 'Meeting Updated',
          properties: newRecurringMeeting.toSegment(),
        });

        await Promise.all([
          updatePeopleTags(people, { add: ['meeting'] }),
          Promise.all(people.map((p) => updateUser(p))),
        ]);
      }
    } else {
      body.venue = getMeetingVenue(body, org, people);
      body.time.last = getLastTime(body.time);

      const meeting = updateMeetingTags(body);

      // TODO: Should I send a 200 status code *and then* send emails? Would that
      // make the front-end feel faster? Or is that a bad development practice?
      await Promise.all([
        updateMeeting(meeting),
        sendEmails(meeting, people, updater, org),
      ]);

      res.status(200).json(meeting.toJSON());

      logger.info(`Updated ${meeting.toString()}.`);

      segment.track({
        userId: uid,
        event: 'Meeting Updated',
        properties: meeting.toSegment(),
      });

      await Promise.all([
        updatePeopleTags(people, { add: ['meeting'] }),
        Promise.all(people.map((p) => updateUser(p))),
      ]);
    }
  } catch (e) {
    handle(e, res);
  }
}
