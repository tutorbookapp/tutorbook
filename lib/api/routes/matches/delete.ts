import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import { handle } from 'lib/api/error';
import deleteMatchDoc from 'lib/api/delete/match-doc';
import deleteMatchSearchObj from 'lib/api/delete/match-search-obj';
import deleteZoom from 'lib/api/delete/zoom';
import getMatch from 'lib/api/get/match';
import getPerson from 'lib/api/get/person';
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

    // Verify the creator exists and that the one sending the request is:
    // a) The creator him/herself OR;
    // b) Admin of the creator's org (e.g. Gunn High School).
    const creator = await getPerson(match.creator);
    await verifyAuth(req.headers, { userId: creator.id, orgIds: creator.orgs });

    await deleteZoom(match.id);
    await deleteMatchDoc(match.id);
    await deleteMatchSearchObj(match.id);

    res.status(200).end();
  } catch (e) {
    handle(e, res);
  }
}
