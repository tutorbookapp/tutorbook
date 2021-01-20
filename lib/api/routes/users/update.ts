import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import { User, UserJSON, isUserJSON } from 'lib/model';
import { handle } from 'lib/api/error';
import updateAuthUser from 'lib/api/update/auth-user';
import updatePhoto from 'lib/api/update/photo';
import updateUserDoc from 'lib/api/update/user-doc';
import updateUserOrgs from 'lib/api/update/user-orgs';
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

    const withOrgsUpdate = updateUserOrgs(body);
    const withPhotoUpdate = await updatePhoto(withOrgsUpdate, User);
    const withAuthUpdate = await updateAuthUser(withPhotoUpdate);

    // TODO: If the user's name or photo has changed, update it across all
    // meetings and matches the user is a `Person` on.

    await Promise.all([
      updateUserDoc(withAuthUpdate),
      updateUserSearchObj(withAuthUpdate),
    ]);

    res.status(200).json(withAuthUpdate.toJSON());
  } catch (e) {
    handle(e, res);
  }
}
