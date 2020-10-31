import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import { Match, MatchJSON, isMatchJSON } from 'lib/model';
import { handle } from 'lib/api/error';
import createMatchDoc from 'lib/api/create/match-doc';
import createMatchNotification from 'lib/api/create/match-notification';
import createMatchSearchObj from 'lib/api/create/match-search-obj';
import createZoom from 'lib/api/create/zoom';
import getOrgsByAdminId from 'lib/api/get/orgs-by-admin-id';
import getPeople from 'lib/api/get/people';
import getPerson from 'lib/api/get/person';
import getStudents from 'lib/api/get/students';
import verifyAuth from 'lib/api/verify/auth';
import verifyBody from 'lib/api/verify/body';
import verifyOrgs from 'lib/api/verify/orgs';
import verifySubjectsCanBeTutored from 'lib/api/verify/subjects-can-be-tutored';
import verifyTimesInAvailability from 'lib/api/verify/times-in-availability';

export type CreateMatchRes = MatchJSON;

/**
 * Creates a new match: A pairing of people (typically between a student and a
 * tutor/mentor).
 * @todo Don't error when a creator is unavailable during the requested times
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

    // TODO: Update the time verification logic to account for recur rules.
    if (body.times) verifyTimesInAvailability(body.times, people);
    verifySubjectsCanBeTutored(body.subjects, people);

    // Verify the creator exists and is sending an authorized request.
    const creator = await getPerson(body.creator, people);
    await verifyAuth(req.headers, { userId: creator.id });

    // Verify the creator is:
    // a) The student him/herself OR;
    // b) Admin of the student's org (e.g. Gunn High School).
    const students = getStudents(people);
    const orgIds = (await getOrgsByAdminId(creator.id)).map((o) => o.id);
    students.forEach((s) => s.id !== creator.id && verifyOrgs(s, orgIds));

    const zoom = await createZoom(body, people);
    const match = await createMatchDoc(body, zoom);
    await createMatchSearchObj(match);
    await createMatchNotification(match, people, creator);

    res.status(201).json(match.toJSON());
  } catch (e) {
    handle(e, res);
  }
}
