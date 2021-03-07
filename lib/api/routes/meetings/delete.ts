import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import deleteMeetingDoc from 'lib/api/delete/meeting-doc';
import deleteMeetingSearchObj from 'lib/api/delete/meeting-search-obj';
import deleteZoom from 'lib/api/delete/zoom';
import getMeeting from 'lib/api/get/meeting';
import getOrg from 'lib/api/get/org';
import getPeople from 'lib/api/get/people';
import getPerson from 'lib/api/get/person';
import { handle } from 'lib/api/error';
import sendEmails from 'lib/mail/meetings/delete';
import verifyAuth from 'lib/api/verify/auth';
import verifyQueryId from 'lib/api/verify/query-id';

export type DeleteMeetingRes = void;

export default async function deleteMeeting(
  req: Req,
  res: Res<DeleteMeetingRes>
): Promise<void> {
  try {
    const id = verifyQueryId(req.query);
    const meeting = await getMeeting(id);

    const { uid } = await verifyAuth(req.headers, {
      userIds: meeting.match.people.map((p) => p.id),
      orgIds: [meeting.match.org],
    });

    const org = await getOrg(meeting.match.org);
    const people = await getPeople(meeting.match.people);
    const deleter = await getPerson({ id: uid }, people);

    await Promise.all([
      deleteZoom(meeting.id),
      deleteMeetingDoc(meeting.id),
      deleteMeetingSearchObj(meeting.id),
      sendEmails(meeting, people, deleter, org),
    ]);

    res.status(200).end();
  } catch (e) {
    handle(e, res);
  }
}
