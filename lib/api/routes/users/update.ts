import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import { DBUser, User, UserJSON, isUserJSON } from 'lib/model/user';
import analytics from 'lib/api/analytics';
import { handle } from 'lib/api/error';
import logger from 'lib/api/logger';
import segment from 'lib/api/segment';
import updateAuthUser from 'lib/api/update/auth-user';
import updatePhoto from 'lib/api/update/photo';
import { updateUser } from 'lib/api/db/user';
import updateUserOrgs from 'lib/api/update/user-orgs';
import updateUserTags from 'lib/api/update/user-tags';
import verifyAuth from 'lib/api/verify/auth';
import verifyBody from 'lib/api/verify/body';
import verifyRecordExists from 'lib/api/verify/record-exists';

export type UpdateUserRes = UserJSON;

export default async function updateUserAPI(
  req: Req,
  res: Res<UpdateUserRes>
): Promise<void> {
  try {
    const body = verifyBody<User, UserJSON>(req.body, isUserJSON, User);

    logger.info(`Updating ${body.toString()}...`);

    // TODO: Check the existing data, not the data that is being sent with the
    // request (e.g. b/c I could fake data and add users to my org).
    const { uid } = await verifyAuth(req.headers, {
      userId: body.id,
      orgIds: body.orgs,
    });
    const originalRecord = await verifyRecordExists<DBUser>('users', body.id);

    const withOrgsUpdate = updateUserOrgs(body);
    const withTagsUpdate = updateUserTags(withOrgsUpdate);
    const withPhotoUpdate = await updatePhoto(withTagsUpdate, User);
    const user = await updateAuthUser(withPhotoUpdate);

    // TODO: If the user's name or photo has changed, update it across all
    // meetings and matches the user is a `Person` on.

    await updateUser(user);

    res.status(200).json(user.toJSON());

    logger.info(`Updated ${user.toString()}.`);

    segment.identify({ userId: user.id, traits: user.toSegment() });
    segment.track({
      userId: uid,
      event: 'User Updated',
      properties: user.toSegment(),
    });

    await analytics(user, 'updated', User.fromDB(originalRecord));
  } catch (e) {
    handle(e, res);
  }
}
