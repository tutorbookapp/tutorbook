import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import { MatchJSON } from 'lib/model';
import { handle } from 'lib/api/error';
import getMatch from 'lib/api/get/match';
import verifyAuth from 'lib/api/verify/auth';
import verifyQueryId from 'lib/api/verify/query-id';

export type FetchMatchRes = MatchJSON;

export default async function fetchMatch(
  req: Req,
  res: Res<FetchMatchRes>
): Promise<void> {
  try {
    const id = verifyQueryId(req.query);
    const match = await getMatch(id);

    // TODO: Right now this only responds to admin requests but we want it to
    // respond to any of the match's people as well.
    await verifyAuth(req.headers, { orgIds: [match.org] });

    res.status(200).json(match.toJSON());
  } catch (e) {
    handle(e, res);
  }
}
