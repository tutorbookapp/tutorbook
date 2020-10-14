import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import {
  MatchJSON,
  MatchesQuery,
  MatchesQueryJSON,
  isMatchesQueryJSON,
} from 'lib/model';
import { handle } from 'lib/api/error';
import getMatches from 'lib/api/get/matches';
import verifyAuth from 'lib/api/verify/auth';
import verifyBody from 'lib/api/verify/body';

export interface ListMatchesRes {
  matches: MatchJSON[];
  hits: number;
}

export default async function listMatches(
  req: Req,
  res: Res<ListMatchesRes>
): Promise<void> {
  try {
    const query = verifyBody<MatchesQuery, MatchesQueryJSON>(
      req.query,
      isMatchesQueryJSON,
      MatchesQuery
    );
    const { matches, hits } = await getMatches(query);
    await verifyAuth(req.headers, { orgIds: query.orgs.map((o) => o.value) });
    res.status(200).json({ hits, matches: matches.map((m) => m.toJSON()) });
  } catch (e) {
    handle(e, res);
  }
}
