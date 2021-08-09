import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import { APIError } from 'lib/model/error';
import { OrgJSON } from 'lib/model/org';
import { getOrgsByAdminId } from 'lib/api/db/org';
import { handle } from 'lib/api/error';
import segment from 'lib/api/segment';
import verifyAuth from 'lib/api/verify/auth';

export type ListOrgsRes = OrgJSON[];

// TODO: Combine this with the main `/api/account` endpoint so that there isn't
// any stagger with when they both load (e.g. sometimes I'll mistakenly show an
// admin a 404 page because their account has loaded but not their orgs).
export default async function orgsAPI(
  req: Req,
  res: Res<ListOrgsRes | APIError>
): Promise<void> {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method as string} Not Allowed`);
  } else {
    try {
      const { uid } = await verifyAuth(req.headers);
      const orgs = await getOrgsByAdminId(uid);
      res.status(200).json(orgs.map((o) => o.toJSON()));
      segment.track({ userId: uid, event: 'Orgs Listed' });
    } catch (e) {
      handle(e, res);
    }
  }
}
