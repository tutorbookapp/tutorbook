import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import deleteMeetingDoc from 'lib/api/delete/meeting-doc';
import deleteMeetingSearchObj from 'lib/api/delete/meeting-search-obj';
import getMeeting from 'lib/api/get/meeting';
import { handle } from 'lib/api/error';
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

    await verifyAuth(req.headers, {
      userIds: meeting.match.people.map((p) => p.id),
      orgIds: [meeting.match.org],
    });

    await deleteMeetingDoc(meeting.id);
    await deleteMeetingSearchObj(meeting.id);

    res.status(200).end();
  } catch (e) {
    handle(e, res);
  }
}
