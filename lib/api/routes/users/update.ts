import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import { User, UserJSON, isUserJSON } from 'lib/model';
import analytics from 'lib/api/analytics';
import { handle } from 'lib/api/error';
import segment from 'lib/api/segment';
import updateAuthUser from 'lib/api/update/auth-user';
import updateAvailability from 'lib/api/update/availability';
import updatePhoto from 'lib/api/update/photo';
import updateUserDoc from 'lib/api/update/user-doc';
import updateUserOrgs from 'lib/api/update/user-orgs';
import updateUserSearchObj from 'lib/api/update/user-search-obj';
import updateUserTags from 'lib/api/update/user-tags';
import verifyAuth from 'lib/api/verify/auth';
import verifyBody from 'lib/api/verify/body';
import verifyDocExists from 'lib/api/verify/doc-exists';

export type UpdateUserRes = UserJSON;

export default async function updateUser(
  req: Req,
  res: Res<UpdateUserRes>
): Promise<void> {
  try {
    const body = verifyBody<User, UserJSON>(req.body, isUserJSON, User);

    // TODO: Check the existing data, not the data that is being sent with the
    // request (e.g. b/c I could fake data and add users to my org).
    const { uid } = await verifyAuth(req.headers, {
      userId: body.id,
      orgIds: body.orgs,
    });
    const originalDoc = await verifyDocExists('users', body.id);

    const withOrgsUpdate = updateUserOrgs(body);
    const withTagsUpdate = updateUserTags(withOrgsUpdate);
    const withPhotoUpdate = await updatePhoto(withTagsUpdate, User);
    const user = await updateAuthUser(withPhotoUpdate);

    // TODO: If the user's name or photo has changed, update it across all
    // meetings and matches the user is a `Person` on.

    await Promise.all([updateUserDoc(user), updateUserSearchObj(user)]);

    res.status(200).json(user.toJSON());

    segment.identify({ userId: user.id, traits: user.toSegment() });
    segment.track({
      userId: uid,
      event: 'User Updated',
      properties: user.toSegment(),
    });

    await analytics(user, 'updated', User.fromFirestoreDoc(originalDoc));
    await updateAvailability(user);
  } catch (e) {
    handle(e, res);
  }
}
