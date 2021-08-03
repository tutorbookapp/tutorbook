import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import { DBMatch, Match, MatchJSON, isMatchJSON } from 'lib/model/match';
import analytics from 'lib/api/analytics';
import getPeople from 'lib/api/get/people';
import { handle } from 'lib/api/error';
import logger from 'lib/api/logger';
import segment from 'lib/api/segment';
import { updateMatch } from 'lib/api/db/match';
import updateMatchTags from 'lib/api/update/match-tags';
import updatePeopleTags from 'lib/api/update/people-tags';
import verifyAuth from 'lib/api/verify/auth';
import verifyBody from 'lib/api/verify/body';
import verifyRecordExists from 'lib/api/verify/record-exists';
import verifySubjectsCanBeTutored from 'lib/api/verify/subjects-can-be-tutored';

export type UpdateMatchRes = MatchJSON;

export default async function updateMatchAPI(
  req: Req,
  res: Res<UpdateMatchRes>
): Promise<void> {
  try {
    const body = verifyBody<Match, MatchJSON>(req.body, isMatchJSON, Match);

    logger.info(`Updating ${body.toString()}...`);

    await verifyRecordExists<DBMatch>('matches', Number(body.id));

    const people = await getPeople(body.people);

    verifySubjectsCanBeTutored(body.subjects, people);

    // TODO: Compare the previous data with the requested updates to ensure that
    // the creator hasn't changed (if it has, users could bypass these checks).
    const { uid } = await verifyAuth(req.headers, {
      userIds: body.people.map((p) => p.id),
      orgIds: [body.org],
    });

    const match = updateMatchTags(body);

    await updateMatch(match);

    res.status(200).json(match.toJSON());

    logger.info(`Updated ${match.toString()}.`);

    segment.track({
      userId: uid,
      event: 'Match Updated',
      properties: match.toSegment(),
    });

    await Promise.all([
      analytics(match, 'updated'),
      updatePeopleTags(people, { add: ['matched'] }),
    ]);
  } catch (e) {
    handle(e, res);
  }
}
