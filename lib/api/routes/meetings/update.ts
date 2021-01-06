import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import { Meeting, MeetingJSON, isMeetingJSON } from 'lib/model';
import getMatch from 'lib/api/get/match';
import { handle } from 'lib/api/error';
import updateMeetingDoc from 'lib/api/update/meeting-doc';
import updateMeetingSearchObj from 'lib/api/update/meeting-search-obj';
import verifyAuth from 'lib/api/verify/auth';
import verifyBody from 'lib/api/verify/body';

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
    body.match = await getMatch(body.match.id);

    await verifyAuth(req.headers, {
      userIds: body.match.people.map((p) => p.id),
      orgIds: [body.match.org],
    });

    await updateMeetingDoc(body);
    await updateMeetingSearchObj(body);

    res.status(200).json(body.toJSON());
  } catch (e) {
    handle(e, res);
  }
}
