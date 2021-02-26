import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import { Meeting, MeetingJSON, isMeetingJSON } from 'lib/model';
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
import verifySubjectsCanBeTutored from 'lib/api/verify/subjects-can-be-tutored';
import verifyTimeInAvailability from 'lib/api/verify/time-in-availability';

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

    await Promise.all([
      verifyDocExists('matches', body.match.id),
      verifyDocExists('meetings', body.id),
    ]);

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

    body.venue = await updateZoom(body, people);

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
  } catch (e) {
    handle(e, res);
  }
}
