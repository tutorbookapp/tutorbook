import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import { User } from 'lib/model/user';
import { accountToSegment } from 'lib/model/account';
import { handle } from 'lib/api/error';
import logger from 'lib/api/logger';
import segment from 'lib/api/segment';
import updateAuthUser from 'lib/api/update/auth-user';
import updateAvailability from 'lib/api/update/availability';
import updatePhoto from 'lib/api/update/photo';
import updateUserDoc from 'lib/api/update/user-doc';
import updateUserOrgs from 'lib/api/update/user-orgs';
import updateUserTags from 'lib/api/update/user-tags';
import verifyAuth from 'lib/api/verify/auth';
import verifyDocExists from 'lib/api/verify/doc-exists';

export type UpdateUserRes = User;

export default async function updateUser(
  req: Req,
  res: Res<UpdateUserRes>
): Promise<void> {
  try {
    const body = User.parse(req.body);

    logger.info(`Updating ${body.toString()}...`);

    // TODO: Check the existing data, not the data that is being sent with the
    // request (e.g. b/c I could fake data and add users to my org).
    const { uid } = await verifyAuth(req.headers, {
      userId: body.id,
      orgIds: body.orgs,
    });
    await verifyDocExists<User>('users', body.id);

    const withOrgsUpdate = updateUserOrgs(body);
    const withTagsUpdate = updateUserTags(withOrgsUpdate);
    const withPhotoUpdate = await updatePhoto(withTagsUpdate);
    const user = await updateAuthUser(withPhotoUpdate);

    // TODO: If the user's name or photo has changed, update it across all
    // meetings and matches the user is a `Person` on.

    await updateUserDoc(user);

    res.status(200).json(user);

    logger.info(`Updated ${user.toString()}.`);

    segment.identify({ userId: user.id, traits: accountToSegment(user) });
    segment.track({
      userId: uid,
      event: 'User Updated',
      properties: accountToSegment(user),
    });

    await updateAvailability(user);
  } catch (e) {
    handle(e, res);
  }
}
