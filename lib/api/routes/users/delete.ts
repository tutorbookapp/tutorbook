import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import { deleteUser, getUser } from 'lib/api/db/user';
import analytics from 'lib/api/analytics';
import deleteAuthUser from 'lib/api/delete/auth-user';
import { handle } from 'lib/api/error';
import logger from 'lib/api/logger';
import segment from 'lib/api/segment';
import verifyAuth from 'lib/api/verify/auth';
import { verifyQueryId } from 'lib/api/verify/query-id';

export type DeleteUserRes = void;

export default async function deleteUserAPI(
  req: Req,
  res: Res<DeleteUserRes>
): Promise<void> {
  try {
    const id = verifyQueryId(req.query);
    const user = await getUser(id);

    logger.info(`Deleting ${user.toString()}...`);

    const { uid } = await verifyAuth(req.headers, {
      userId: user.id,
      orgIds: user.orgs,
    });

    // TODO: Once we get our GCP Storage buckets organized, I should also delete
    // all of the user-uploaded media (e.g. profile photos, banner images).

    // TODO: Delete this user from all meetings and matches. Notify the other
    // people on each of those meetings/matches that the user has been deleted.

    await Promise.all([deleteAuthUser(user.id), deleteUser(user.id)]);

    logger.info(`Deleted ${user.toString()}.`);

    res.status(200).end();

    segment.track({
      userId: uid,
      event: 'User Deleted',
      properties: user.toSegment(),
    });

    await analytics(user, 'deleted');
  } catch (e) {
    handle(e, res);
  }
}
