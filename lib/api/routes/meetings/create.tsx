import { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import { renderToStaticMarkup } from 'react-dom/server';

import { Meeting, MeetingJSON, isMeetingJSON } from 'lib/model/meeting';
import Email from 'lib/mail/meeting';
import { createMeeting } from 'lib/api/db/meeting';
import getLastTime from 'lib/api/get/last-time';
import getMeetingVenue from 'lib/api/get/meeting-venue';
import { getOrg } from 'lib/api/db/org';
import getPeople from 'lib/api/get/people';
import getPerson from 'lib/api/get/person';
import { handle } from 'lib/api/error';
import { join } from 'lib/utils';
import logger from 'lib/api/logger';
import segment from 'lib/api/segment';
import send from 'lib/mail/send';
import updateMeetingTags from 'lib/api/update/meeting-tags';
import updatePeopleTags from 'lib/api/update/people-tags';
import { updateUser } from 'lib/api/db/user';
import verifyAuth from 'lib/api/verify/auth';
import verifyBody from 'lib/api/verify/body';
import verifyIsOrgAdmin from 'lib/api/verify/is-org-admin';
import verifySubjectsCanBeTutored from 'lib/api/verify/subjects-can-be-tutored';
import verifyTimeInAvailability from 'lib/api/verify/time-in-availability';

export type CreateMeetingRes = MeetingJSON;

export default async function createMeetingAPI(
  req: Req,
  res: Res<CreateMeetingRes>
): Promise<void> {
  try {
    const body = verifyBody<Meeting, MeetingJSON>(
      req.body,
      isMeetingJSON,
      Meeting
    );
    const people = await getPeople(body.people);

    logger.info(`Creating ${body.toString()}...`);

    // TODO: Actually implement availability verification.
    verifyTimeInAvailability(body.time, people);
    verifySubjectsCanBeTutored(body.subjects, people);

    const org = await getOrg(body.org);
    const creator = await getPerson(body.creator, people);
    await verifyAuth(req.headers, { userId: creator.id });

    // TODO: Verify that the creator is creating a meeting with people who:
    // - They've had a meeting with before, OR;
    // - Are members of an org they're an admin of, OR;
    // - Are visible in an org that they have access to (i.e. booking).

    // Verify the meeting creator is:
    // a) One of the meeting people, OR;
    // b) Admin of the meeting's org (e.g. Gunn High School).
    const isMeetingPerson = body.people.some((p) => p.id === creator.id);
    if (!isMeetingPerson) verifyIsOrgAdmin(org, creator.id);

    body.venue = getMeetingVenue(body, org, people);
    body.time.last = getLastTime(body.time);

    const meeting = await createMeeting(updateMeetingTags(body));

    await send({
      to: people.filter((p) => p.email && p.id !== creator.id),
      cc: creator,
      subject: `${creator.name} booked a ${join(meeting.subjects)} meeting`,
      html: renderToStaticMarkup(<Email meeting={meeting} />),
    });

    res.status(200).json(meeting.toJSON());

    logger.info(`Created ${meeting.toString()}.`);

    segment.track({
      userId: creator.id,
      event: 'Meeting Created',
      properties: meeting.toSegment(),
    });

    // TODO: Don't use fire-and-forget triggers for these tags updates. Ideally,
    // I'd calculate the existance of these user tags using PostgreSQL.
    await Promise.all([
      updatePeopleTags(people, { add: ['meeting'] }),
      Promise.all(people.map((p) => updateUser(p))),
    ]);
  } catch (e) {
    handle(e, res);
  }
}
