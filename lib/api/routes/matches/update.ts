import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import { Match, MatchJSON, isMatchJSON } from 'lib/model';
import { handle } from 'lib/api/error';
import getOrgsByAdminId from 'lib/api/get/orgs-by-admin-id';
import getPeople from 'lib/api/get/people';
import getPerson from 'lib/api/get/person';
import getStudents from 'lib/api/get/students';
import updateMatchDoc from 'lib/api/update/match-doc';
import updateMatchSearchObj from 'lib/api/update/match-search-obj';
import updateZoom from 'lib/api/update/zoom';
import verifyAuth from 'lib/api/verify/auth';
import verifyBody from 'lib/api/verify/body';
import verifyOrgs from 'lib/api/verify/orgs';
import verifySubjectsCanBeTutored from 'lib/api/verify/subjects-can-be-tutored';
import verifyTimeInAvailability from 'lib/api/verify/time-in-availability';

export type UpdateMatchRes = MatchJSON;

export default async function updateMatch(
  req: Req,
  res: Res<UpdateMatchRes>
): Promise<void> {
  try {
    const body = verifyBody<Match, MatchJSON>(req.body, isMatchJSON, Match);
    const people = await getPeople(body.people);

    // TODO: Update the time verification logic to account for recur rules.
    if (body.time) verifyTimeInAvailability(body.time, people);
    verifySubjectsCanBeTutored(body.subjects, people);

    // Verify the creator exists and that the one sending the request is:
    // a) The creator him/herself OR;
    // b) Admin of the creator's org (e.g. Gunn High School).
    const creator = await getPerson(body.creator, people);
    await verifyAuth(req.headers, { userId: creator.id, orgIds: creator.orgs });

    // Verify the creator is:
    // a) The student him/herself OR;
    // b) Admin of the student's org (e.g. Gunn High School).
    const students = getStudents(people);

    // TODO: Ensure that this isn't performing a duplicate request that the
    // `verifyAuth` route component already performed.
    const orgIds = (await getOrgsByAdminId(creator.id)).map((o) => o.id);
    students.forEach((s) => s.id !== creator.id && verifyOrgs(s, orgIds));

    const zoom = await updateZoom(body, people);
    const match = await updateMatchDoc(body, zoom);
    await updateMatchSearchObj(match);

    res.status(200).json(match.toJSON());
  } catch (e) {
    handle(e, res);
  }
}
