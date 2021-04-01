import { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import to from 'await-to-js';

import { UserJSON } from 'lib/model/user';
import { UsersQuery, UsersQueryURL, isUsersQueryURL } from 'lib/model/query/users';
import getTruncatedUser from 'lib/api/get/truncated-user';
import getUsers from 'lib/api/get/users';
import { handle } from 'lib/api/error';
import segment from 'lib/api/segment';
import verifyAuth from 'lib/api/verify/auth';
import verifyQuery from 'lib/api/verify/query';

export interface ListUsersRes {
  users: UserJSON[];
  hits: number;
}

export default async function listUsers(
  req: Req,
  res: Res<ListUsersRes>
): Promise<void> {
  try {
    const query = verifyQuery<UsersQuery, UsersQueryURL>(
      req.query,
      isUsersQueryURL,
      UsersQuery
    );
    const { results, hits } = await getUsers(query);

    // TODO: Don't completely error; instead, conditionally truncated users.
    const [err, attrs] = await to(
      verifyAuth(req.headers, { orgIds: query.orgs })
    );
    const users = err ? results.map(getTruncatedUser) : results;

    res.status(200).json({ hits, users: users.map((u) => u.toJSON()) });

    if (attrs?.uid)
      segment.track({ userId: attrs?.uid, event: 'Users Listed' });
  } catch (e) {
    handle(e, res);
  }
}
