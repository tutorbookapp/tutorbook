import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import {
  MatchJSON,
  MatchesQuery,
  MatchesQueryURL,
  isMatchesQueryURL,
} from 'lib/model';
import { handle } from 'lib/api/error';
import getMatches from 'lib/api/get/matches';
import verifyAuth from 'lib/api/verify/auth';
import verifyQuery from 'lib/api/verify/query';

export interface ListMatchesRes {
  matches: MatchJSON[];
  hits: number;
}

export default async function listMatches(
  req: Req,
  res: Res<ListMatchesRes>
): Promise<void> {
  try {
    const query = verifyQuery<MatchesQuery, MatchesQueryURL>(
      req.query,
      isMatchesQueryURL,
      MatchesQuery
    );
    const { matches, hits } = await getMatches(query);
    await verifyAuth(req.headers, { orgIds: query.orgs.map((o) => o.value) });
    res.status(200).json({ hits, matches: matches.map((m) => m.toJSON()) });
  } catch (e) {
    handle(e, res);
  }
}
