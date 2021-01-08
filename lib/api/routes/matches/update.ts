import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import { Match, MatchJSON, isMatchJSON } from 'lib/model';
import getOrgsByAdminId from 'lib/api/get/orgs-by-admin-id';
import getPeople from 'lib/api/get/people';
import getPerson from 'lib/api/get/person';
import getStudents from 'lib/api/get/students';
import { handle } from 'lib/api/error';
import updateMatchDoc from 'lib/api/update/match-doc';
import updateMatchSearchObj from 'lib/api/update/match-search-obj';
import verifyAuth from 'lib/api/verify/auth';
import verifyBody from 'lib/api/verify/body';
import verifyOrgs from 'lib/api/verify/orgs';
import verifySubjectsCanBeTutored from 'lib/api/verify/subjects-can-be-tutored';

export type UpdateMatchRes = MatchJSON;

export default async function updateMatch(
  req: Req,
  res: Res<UpdateMatchRes>
): Promise<void> {
  try {
    const body = verifyBody<Match, MatchJSON>(req.body, isMatchJSON, Match);
    const people = await getPeople(body.people);

    verifySubjectsCanBeTutored(body.subjects, people);

    // TODO: Allow any person who is part of the match to update it.
    // Verify the creator exists and that the one sending the request is:
    // a) The creator him/herself OR;
    // b) Admin of the creator's org (e.g. Gunn High School).
    const creator = await getPerson(body.creator, people);
    await verifyAuth(req.headers, { userId: creator.id, orgIds: creator.orgs });

    // TODO: Compare the previous data with the requested updates to ensure that
    // the creator hasn't changed (if it has, users could bypass these checks).

    // Verify the creator is:
    // a) The student him/herself OR;
    // b) Admin of the student's org (e.g. Gunn High School).
    const students = getStudents(people);

    // TODO: Ensure that this isn't performing a duplicate request that the
    // `verifyAuth` route component already performed.
    const orgIds = (await getOrgsByAdminId(creator.id)).map((o) => o.id);
    students.forEach((s) => s.id !== creator.id && verifyOrgs(s, orgIds));

    await updateMatchDoc(body);
    await updateMatchSearchObj(body);

    res.status(200).json(body.toJSON());
  } catch (e) {
    handle(e, res);
  }
}
