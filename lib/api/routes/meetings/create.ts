import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import { Meeting, MeetingJSON, isMeetingJSON } from 'lib/model';
import createMatchDoc from 'lib/api/create/match-doc';
import createMatchSearchObj from 'lib/api/create/match-search-obj';
import createMeetingDoc from 'lib/api/create/meeting-doc';
import createMeetingSearchObj from 'lib/api/create/meeting-search-obj';
import createZoom from 'lib/api/create/zoom';
import getOrg from 'lib/api/get/org';
import getPeople from 'lib/api/get/people';
import getPerson from 'lib/api/get/person';
import getUser from 'lib/api/get/user';
import { handle } from 'lib/api/error';
import sendEmails from 'lib/mail/meetings/create';
import verifyAuth from 'lib/api/verify/auth';
import verifyBody from 'lib/api/verify/body';
import verifyMeetingCreator from 'lib/api/verify/meeting-creator';
import verifyOrgAdminsInclude from 'lib/api/verify/org-admins-include';
import verifySubjectsCanBeTutored from 'lib/api/verify/subjects-can-be-tutored';
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
    const people = await getPeople(body.match.people);

    // TODO: Update the time verification logic to account for recur rules.
    verifyTimeInAvailability(body.time, people);
    verifySubjectsCanBeTutored(body.match.subjects, people);
    verifyMeetingCreator(body);

    // TODO: Verify the creator exists, is sending an authorized request, and:
    // - The creator is also the creator of the meeting's match, OR;
    // - The meeting's match already exists (i.e. was created by someone else).
    const creator = await getPerson(body.creator, people);
    await verifyAuth(req.headers, { userId: creator.id });

    // Verify the creator is:
    // a) One of the meeting's match's people, OR;
    // b) Admin of the meeting's match's org (e.g. Gunn High School).
    const org = await getOrg(body.match.org);
    if (!people.some((s) => s.id === creator.id))
      verifyOrgAdminsInclude(org, creator.id);

    // TODO: Don't create the match if it already exists.
    body.match = await createMatchDoc(body.match);
    body.venue = await createZoom(body, people);

    const meeting = await createMeetingDoc(body);

    await Promise.all([
      createMatchSearchObj(body.match),
      createMeetingSearchObj(meeting),
    ]);

    const orgAdmins = await Promise.all(org.members.map((id) => getUser(id)));
    await sendEmails(meeting, people, creator, org, orgAdmins);

    res.status(200).json(meeting.toJSON());
  } catch (e) {
    handle(e, res);
  }
}
