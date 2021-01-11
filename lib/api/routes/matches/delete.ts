import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import deleteMatchDoc from 'lib/api/delete/match-doc';
import deleteMatchSearchObj from 'lib/api/delete/match-search-obj';
import getMatch from 'lib/api/get/match';
import { handle } from 'lib/api/error';
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

    await verifyAuth(req.headers, {
      userIds: match.people.map((p) => p.id),
      orgIds: [match.org],
    });

    await deleteMatchDoc(match.id);
    await deleteMatchSearchObj(match.id);

    res.status(200).end();
  } catch (e) {
    handle(e, res);
  }
}
