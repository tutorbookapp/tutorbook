import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import { Meeting, MeetingJSON, isMeetingJSON } from 'lib/model';
import createMeetingDoc from 'lib/api/create/meeting-doc';
import createMeetingSearchObj from 'lib/api/create/meeting-search-obj';
import createZoom from 'lib/api/create/zoom';
import getMatch from 'lib/api/get/match';
import getOrg from 'lib/api/get/org';
import getPeople from 'lib/api/get/people';
import getPerson from 'lib/api/get/person';
import getStudents from 'lib/api/get/students';
import getUser from 'lib/api/get/user';
import { handle } from 'lib/api/error';
import sendEmails from 'lib/mail/meetings/create';
import verifyAuth from 'lib/api/verify/auth';
import verifyBody from 'lib/api/verify/body';
import verifyOrgAdminsInclude from 'lib/api/verify/org-admins-include';
import verifyTimeInAvailability from 'lib/api/verify/time-in-availability';

export type CreateMeetingRes = MeetingJSON;

export default async function createMeeting(
  req: Req,
  res: Res<CreateMeetingRes>
): Promise<void> {
  try {
    const body = verifyBody<Meeting, MeetingJSON>(
      req.body,
      isMeetingJSON,
      Meeting
    );

    body.match = await getMatch(body.match.id);

    const people = await getPeople(body.match.people);

    // TODO: Update the time verification logic to account for recur rules.
    verifyTimeInAvailability(body.time, people);

    // Verify the creator exists and is sending an authorized request.
    const creator = await getPerson(body.creator, people);
    await verifyAuth(req.headers, { userId: creator.id });

    // Verify the creator is:
    // a) The student him/herself OR;
    // b) Admin of the meeting's match's org (e.g. Gunn High School).
    const students = getStudents(people);
    const org = await getOrg(body.match.org);
    if (!students.some((s) => s.id === creator.id))
      verifyOrgAdminsInclude(org, creator.id);

    body.venue = await createZoom(body, people);

    const meeting = await createMeetingDoc(body);
    await createMeetingSearchObj(meeting);

    const orgAdmins = await Promise.all(org.members.map((id) => getUser(id)));
    await sendEmails(meeting, people, creator, org, orgAdmins);

    res.status(200).json(meeting.toJSON());
  } catch (e) {
    handle(e, res);
  }
}
