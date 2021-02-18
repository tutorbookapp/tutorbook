import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import { Match, MatchJSON, isMatchJSON } from 'lib/model';
import createMatchDoc from 'lib/api/create/match-doc';
import createMatchSearchObj from 'lib/api/create/match-search-obj';
import getOrg from 'lib/api/get/org';
import getPeople from 'lib/api/get/people';
import getPerson from 'lib/api/get/person';
import getStudents from 'lib/api/get/students';
import { handle } from 'lib/api/error';
import verifyAuth from 'lib/api/verify/auth';
import verifyBody from 'lib/api/verify/body';
import verifyIsOrgAdmin from 'lib/api/verify/is-org-admin';
import verifySubjectsCanBeTutored from 'lib/api/verify/subjects-can-be-tutored';

export type CreateMatchRes = MatchJSON;

/**
 * Creates a new match: A pairing of people (typically between a student and a
 * tutor/mentor).
 * @todo Don't error when a creator is unavailable during the requested time
 * (or, even better, add this timeslot to their availability and then remove it
 * during post-creation logic).
 */
export default async function createMatch(
  req: Req,
  res: Res<CreateMatchRes>
): Promise<void> {
  try {
    const body = verifyBody<Match, MatchJSON>(req.body, isMatchJSON, Match);
    const people = await getPeople(body.people);

    verifySubjectsCanBeTutored(body.subjects, people);

    // Verify the creator exists and is sending an authorized request.
    const creator = await getPerson(body.creator, people);
    await verifyAuth(req.headers, { orgIds: [body.org] });

    // Verify the creator is:
    // a) The student him/herself, OR;
    // b) Admin of the match's org (e.g. Gunn High School).
    const studentIds = getStudents(people).map((p) => p.id);
    const org = await getOrg(body.org);
    if (!studentIds.includes(creator.id)) verifyIsOrgAdmin(org, creator.id);

    const match = await createMatchDoc(body);
    await createMatchSearchObj(match);

    res.status(201).json(match.toJSON());
  } catch (e) {
    handle(e, res);
  }
}
