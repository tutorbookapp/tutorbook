import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import { User, UserJSON, isUserJSON } from 'lib/model';
import { handle } from 'lib/api/error';
import updateAuthUser from 'lib/api/update/auth-user';
import updateUserDoc from 'lib/api/update/user-doc';
import updateUserSearchObj from 'lib/api/update/user-search-obj';
import verifyAuth from 'lib/api/verify/auth';
import verifyBody from 'lib/api/verify/body';

export type UpdateUserRes = UserJSON;

export default async function updateUser(
  req: Req,
  res: Res<UpdateUserRes>
): Promise<void> {
  try {
    const body = verifyBody<User, UserJSON>(req.body, isUserJSON, User);

    // TODO: Check the existing data, not the data that is being sent with the
    // request (e.g. b/c I could fake data and add users to my org).
    await verifyAuth(req.headers, { userId: body.id, orgIds: body.orgs });

    const user = await updateUserDoc(await updateAuthUser(body));
    await updateUserSearchObj(user);
    res.status(200).json(user.toJSON());
  } catch (e) {
    handle(e, res);
  }
}
