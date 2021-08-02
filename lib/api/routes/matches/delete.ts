import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import { deleteMatch, getMatch } from 'lib/api/db/match';
import analytics from 'lib/api/analytics';
import deleteMatchSearchObj from 'lib/api/delete/match-search-obj';
import getPeople from 'lib/api/get/people';
import { handle } from 'lib/api/error';
import logger from 'lib/api/logger';
import segment from 'lib/api/segment';
import updatePeopleTags from 'lib/api/update/people-tags';
import verifyAuth from 'lib/api/verify/auth';
import verifyQueryId from 'lib/api/verify/query-id';

export type DeleteMatchRes = void;

export default async function deleteMatchAPI(
  req: Req,
  res: Res<DeleteMatchRes>
): Promise<void> {
  try {
    const id = verifyQueryId(req.query);
    const match = await getMatch(id);

    logger.info(`Deleting ${match.toString()}...`);

    const { uid } = await verifyAuth(req.headers, {
      userIds: match.people.map((p) => p.id),
      orgIds: [match.org],
    });

    await Promise.all([deleteMatch(match.id), deleteMatchSearchObj(match.id)]);

    res.status(200).end();

    logger.info(`Deleted ${match.toString()}.`);

    segment.track({
      userId: uid,
      event: 'Match Deleted',
      properties: match.toSegment(),
    });

    const people = await getPeople(match.people);

    // TODO: We shouldn't remove the `matched` tag from a user if they still
    // have other matches. Perhaps calculate this using a CRON job instead.
    await Promise.all([
      analytics(match, 'deleted'),
      updatePeopleTags(people, { remove: ['matched'] }),
    ]);
  } catch (e) {
    handle(e, res);
  }
}
