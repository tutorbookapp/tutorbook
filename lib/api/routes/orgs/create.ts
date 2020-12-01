import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import { Org, OrgJSON, isOrgJSON } from 'lib/model';
import { handle } from 'lib/api/error';
import createOrgDoc from 'lib/api/create/org-doc';
import updatePhoto from 'lib/api/update/photo';
import verifyAuth from 'lib/api/verify/auth';
import verifyBody from 'lib/api/verify/body';
import verifyOrgAdminsInclude from 'lib/api/verify/org-admins-include';

export type CreateOrgRes = OrgJSON;

export default async function createOrg(
  req: Req,
  res: Res<CreateOrgRes>
): Promise<void> {
  try {
    const body = verifyBody<Org, OrgJSON>(req.body, isOrgJSON, Org);
    const { uid } = await verifyAuth(req.headers);
    verifyOrgAdminsInclude(body, uid);
    const org = await createOrgDoc(await updatePhoto(body, Org));
    res.status(201).json(org.toJSON());
  } catch (e) {
    handle(e, res);
  }
}
