import { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import to from 'await-to-js';

import {
  UserJSON,
  UsersQuery,
  UsersQueryJSON,
  isUsersQueryJSON,
} from 'lib/model';
import { handle } from 'lib/api/error';
import getTruncatedUsers from 'lib/api/get/truncated-users';
import getUsers from 'lib/api/get/users';
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
    const query = verifyQuery<UsersQuery, UsersQueryJSON>(
      req.query,
      isUsersQueryJSON,
      UsersQuery
    );
    const { users, hits } = await getUsers(query);
    const [err] = await to(
      verifyAuth(req.headers, { orgIds: query.orgs.map((o) => o.value) })
    );
    res.status(200).json({
      hits,
      users: (err ? getTruncatedUsers(users) : users).map((u) => u.toJSON()),
    });
  } catch (e) {
    handle(e, res);
  }
}
