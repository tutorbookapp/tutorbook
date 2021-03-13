import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import deleteMatchDoc from 'lib/api/delete/match-doc';
import deleteMatchSearchObj from 'lib/api/delete/match-search-obj';
import getMatch from 'lib/api/get/match';
import { handle } from 'lib/api/error';
import segment from 'lib/api/segment';
import verifyAuth from 'lib/api/verify/auth';
import verifyQueryId from 'lib/api/verify/query-id';

export type DeleteMatchRes = void;

export default async function deleteMatch(
  req: Req,
  res: Res<DeleteMatchRes>
): Promise<void> {
  try {
    const id = verifyQueryId(req.query);
    const match = await getMatch(id);

    const { uid } = await verifyAuth(req.headers, {
      userIds: match.people.map((p) => p.id),
      orgIds: [match.org],
    });

    await Promise.all([
      deleteMatchDoc(match.id),
      deleteMatchSearchObj(match.id),
    ]);

    res.status(200).end();

    segment.track({
      userId: uid,
      event: 'Match Deleted',
      properties: match.toSegment(),
    });
  } catch (e) {
    handle(e, res);
  }
}
