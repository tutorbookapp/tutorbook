import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import { UserJSON } from 'lib/model';
import getMatch from 'lib/api/get/match';
import getTruncatedUser from 'lib/api/get/truncated-user';
import getUser from 'lib/api/get/user';
import { handle } from 'lib/api/error';
import verifyAuth from 'lib/api/verify/auth';
import verifyQueryId from 'lib/api/verify/query-id';

export type FetchPeopleRes = UserJSON[];

export default async function fetchPeople(
  req: Req,
  res: Res<FetchPeopleRes>
): Promise<void> {
  try {
    const id = verifyQueryId(req.query);
    const match = await getMatch(id);

    const { uid, adminOf } = await verifyAuth(req.headers, {
      userIds: match.people.map((p) => p.id),
      orgIds: [match.org],
    });
    const people = await Promise.all(
      match.people.map(async (p) => {
        const user = await getUser(p.id);
        if (uid === user.id) return user;
        if (user.orgs.some((o) => adminOf?.includes(o))) return user;
        return getTruncatedUser(user);
      })
    );

    res.status(200).json(people.map((p) => p.toJSON()));
  } catch (e) {
    handle(e, res);
  }
}
