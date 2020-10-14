import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import { OrgJSON } from 'lib/model';
import { handle } from 'lib/api/helpers/error';
import getOrg from 'lib/api/get/org';
import verifyAuth from 'lib/api/verify/auth';
import verifyQueryId from 'lib/api/verify/query-id';

export type FetchOrgRes = OrgJSON;

/**
 * Fetches the requested org data.
 * @todo Why was this API endpoint restricted in the first place? Can't anyone
 * access it's data through the pre-rendered org landing pages?
 */
export default async function fetchOrg(
  req: Req,
  res: Res<FetchOrgRes>
): Promise<void> {
  try {
    const id = verifyQueryId(req.query);
    await verifyAuth(req.headers, { orgIds: [id] });
    res.status(200).json((await getOrg(id)).toJSON());
  } catch (e) {
    handle(e, res);
  }
}
