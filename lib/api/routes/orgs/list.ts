import { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import to from 'await-to-js';

import { OrgJSON } from 'lib/model/org';
import { getOrgs } from 'lib/api/db/org';
import { handle } from 'lib/api/error';
import segment from 'lib/api/segment';
import verifyAuth from 'lib/api/verify/auth';

export type ListOrgsRes = OrgJSON[];

export default async function listOrgs(
  req: Req,
  res: Res<ListOrgsRes>
): Promise<void> {
  try {
    const orgs = await getOrgs();
    res.status(200).json(orgs.map((o) => o.toJSON()));
    const attrs = (await to(verifyAuth(req.headers)))[1];
    if (attrs) segment.track({ userId: attrs.uid, event: 'Orgs Listed' });
  } catch (e) {
    handle(e, res);
  }
}
