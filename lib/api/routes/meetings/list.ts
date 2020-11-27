import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import { MeetingJSON } from 'lib/model';
import getMeetings from 'lib/api/get/meetings';
import getMatch from 'lib/api/get/match';
import { handle } from 'lib/api/error';
import verifyAuth from 'lib/api/verify/auth';
import verifyQueryId from 'lib/api/verify/query-id';

export type ListMeetingsRes = MeetingJSON[];

export default async function listMeetings(
  req: Req,
  res: Res<ListMeetingsRes>
): Promise<void> {
  try {
    const id = verifyQueryId(req.query);
    const [match, meetings] = await Promise.all([
      getMatch(id),
      getMeetings(id),
    ]);

    await verifyAuth(req.headers, {
      userIds: match.people.map((p) => p.id),
      orgIds: [match.org],
    });

    res.status(200).json(meetings.map((m) => m.toJSON()));
  } catch (e) {
    handle(e, res);
  }
}
