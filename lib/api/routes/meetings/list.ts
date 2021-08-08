import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import { APIError } from 'lib/model/error';
import { MeetingJSON } from 'lib/model/meeting';
import { MeetingsQuery } from 'lib/model/query/meetings';
import { getMeetings } from 'lib/api/db/meeting';
import { handle } from 'lib/api/error';
import segment from 'lib/api/segment';
import verifyAuth from 'lib/api/verify/auth';

export interface ListMeetingsRes {
  meetings: MeetingJSON[];
  hits: number;
}

export default async function listMeetings(
  req: Req,
  res: Res<ListMeetingsRes>
): Promise<void> {
  try {
    const query = MeetingsQuery.params(req.query as Record<string, string>);

    // User must be either:
    // a) An org admin of the matches requested, OR;
    // b) The person whose matches are being requested.
    if (query.people.length !== 1 && !query.org)
      throw new APIError('You must filter meetings by org or people', 400);
    const { uid } = await verifyAuth(req.headers, {
      userId: query.people.length === 1 ? query.people[0] : undefined,
      orgIds: query.org ? [query.org] : undefined,
    });

    const { results, hits } = await getMeetings(query);
    res.status(200).json({ hits, meetings: results.map((m) => m.toJSON()) });

    segment.track({ userId: uid, event: 'Meetings Listed' });
  } catch (e) {
    handle(e, res);
  }
}
