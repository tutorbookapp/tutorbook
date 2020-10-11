import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import { User, UserJSON, isUserJSON } from 'lib/model';
import { handle } from 'lib/api/helpers/error';
import createAuthUser from 'lib/api/create/auth-user';
import createUserDoc from 'lib/api/create/user-doc';
import createUserNotification from 'lib/api/create/user-notification';
import verifyBody from 'lib/api/verify/body';

/**
 * Creates a new user.
 */
export default async function createUser(
  req: Req,
  res: Res<UserJSON>
): Promise<void> {
  try {
    const body = verifyBody<User, UserJSON>(req.body, isUserJSON, User);
    const user = await createUserDoc(await createAuthUser(body));
    await createUserNotification(user);
    res.status(201).json(user.toJSON());
  } catch (e) {
    handle(e, res);
  }
}
