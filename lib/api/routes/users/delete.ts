import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import { handle } from 'lib/api/error';
import deleteAuthUser from 'lib/api/delete/auth-user';
import deleteUserDoc from 'lib/api/delete/user-doc';
import deleteUserSearchObj from 'lib/api/delete/user-search-obj';
import getUser from 'lib/api/get/user';
import verifyAuth from 'lib/api/verify/auth';
import verifyQueryId from 'lib/api/verify/query-id';

export type DeleteUserRes = void;

export default async function deleteUser(
  req: Req,
  res: Res<DeleteUserRes>
): Promise<void> {
  try {
    const id = verifyQueryId(req.query);
    const user = await getUser(id);

    await verifyAuth(req.headers, { userId: user.id, orgIds: user.orgs });

    await deleteAuthUser(user.id);
    await deleteUserDoc(user.id);
    await deleteUserSearchObj(user.id);

    res.status(200).end();
  } catch (e) {
    handle(e, res);
  }
}
