import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import { Org, OrgJSON, isOrgJSON } from 'lib/model';
import { handle } from 'lib/api/error';
import getOrg from 'lib/api/get/org';
import updateOrgDoc from 'lib/api/update/org-doc';
import updatePhoto from 'lib/api/update/photo';
import verifyAuth from 'lib/api/verify/auth';
import verifyBody from 'lib/api/verify/body';
import verifyMembersUnchanged from 'lib/api/verify/members-unchanged';

export type UpdateOrgRes = OrgJSON;

// TODO: Add API route specs that define what is able to be changed and what is
// not (e.g. here, you cannot change the org's members and for the `api/users`
// endpoint, you cannot change the user's email address).
export default async function updateOrg(
  req: Req,
  res: Res<UpdateOrgRes>
): Promise<void> {
  try {
    const body = verifyBody<Org, OrgJSON>(req.body, isOrgJSON, Org);
    await verifyAuth(req.headers, { orgIds: [body.id] });
    const prev = await getOrg(body.id);
    verifyMembersUnchanged(prev, body);
    await updatePhoto(body);
    const org = await updateOrgDoc(body);
    res.status(200).json(org.toJSON());
  } catch (e) {
    handle(e, res);
  }
}
