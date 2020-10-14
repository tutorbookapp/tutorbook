import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import { User, UserJSON, isUserJSON } from 'lib/model';
import { handle } from 'lib/api/error';
import updateAuthUser from 'lib/api/update/auth-user';
import updateUserDoc from 'lib/api/update/user-doc';
import verifyBody from 'lib/api/verify/body';

export type UpdateUserRes = UserJSON;

export default async function updateUser(
  req: Req,
  res: Res<UpdateUserRes>
): Promise<void> {
  try {
    const body = verifyBody<User, UserJSON>(req.body, isUserJSON, User);
    const user = await updateUserDoc(await updateAuthUser(body));
    res.status(200).json(user.toJSON());
  } catch (e) {
    handle(e, res);
  }
}
