import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import { UserJSON } from 'lib/model';
import { handle } from 'lib/api/error';
import getPerson from 'lib/api/get/person';
import verifyAuth from 'lib/api/verify/auth';
import verifyQueryId from 'lib/api/verify/query-id';

export type FetchUserRes = UserJSON;

/**
 * Fetches data for the requested user.
 * @todo Send truncated data instead of completely erroring when the user
 * doesn't have access to full data.
 * @todo Refactor `getPerson` to call a lower-level `getUser` function that can
 * be used here (instead of specifying useless `handle` and `roles` props).
 */
export default async function fetchUser(
  req: Req,
  res: Res<FetchUserRes>
): Promise<void> {
  try {
    const id = verifyQueryId(req.query);
    const user = await getPerson({ id, roles: [], handle: '' });
    await verifyAuth(req.headers, { userId: id, orgIds: user.orgs });
    res.status(200).json(user.toJSON());
  } catch (e) {
    handle(e, res);
  }
}
