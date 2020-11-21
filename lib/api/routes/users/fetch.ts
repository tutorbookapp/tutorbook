import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import { UserJSON } from 'lib/model';
import { handle } from 'lib/api/error';
import getUser from 'lib/api/get/user';
import getUserHash from 'lib/api/get/user-hash';
import verifyAuth from 'lib/api/verify/auth';
import verifyQueryId from 'lib/api/verify/query-id';

export type FetchUserRes = UserJSON;

/**
 * Fetches data for the requested user.
 * @todo Send truncated data instead of completely erroring when the user
 * doesn't have access to full data.
 */
export default async function fetchUser(
  req: Req,
  res: Res<FetchUserRes>
): Promise<void> {
  try {
    const userId = verifyQueryId(req.query);
    const user = await getUser(userId);
    const uid = await verifyAuth(req.headers, { userId, orgIds: user.orgs });
    const hash = uid === userId ? getUserHash(uid) : null;
    res.status(200).json({ ...user.toJSON(), hash });
  } catch (e) {
    handle(e, res);
  }
}
