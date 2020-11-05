import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import { Match, MatchJSON, isMatchJSON } from 'lib/model';
import createMatchDoc from 'lib/api/create/match-doc';
import createMatchSearchObj from 'lib/api/create/match-search-obj';
import createZoom from 'lib/api/create/zoom';
import getOrg from 'lib/api/get/org';
import getPeople from 'lib/api/get/people';
import getPerson from 'lib/api/get/person';
import getStudents from 'lib/api/get/students';
import getUser from 'lib/api/get/user';
import { handle } from 'lib/api/error';
import sendEmails from 'lib/mail/matches/create';
import verifyAuth from 'lib/api/verify/auth';
import verifyBody from 'lib/api/verify/body';
import verifyOrgAdminsInclude from 'lib/api/verify/org-admins-include';
import verifySubjectsCanBeTutored from 'lib/api/verify/subjects-can-be-tutored';
import verifyTimeInAvailability from 'lib/api/verify/time-in-availability';

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

    // TODO: Update the time verification logic to account for recur rules.
    if (body.time) verifyTimeInAvailability(body.time, people);
    verifySubjectsCanBeTutored(body.subjects, people);

    // Verify the creator exists and is sending an authorized request.
    const creator = await getPerson(body.creator, people);
    await verifyAuth(req.headers, { userId: creator.id });

    // Verify the creator is:
    // a) The student him/herself OR;
    // b) Admin of the match's org (e.g. Gunn High School).
    const students = getStudents(people);
    const org = await getOrg(body.org);
    if (!students.some((s) => s.id === creator.id))
      verifyOrgAdminsInclude(org, creator.id);

    const zoom = await createZoom(body, people);
    const match = await createMatchDoc(body, zoom);
    await createMatchSearchObj(match);

    const orgAdmins = await Promise.all(org.members.map((id) => getUser(id)));
    await sendEmails(match, people, creator, org, orgAdmins);

    res.status(201).json(match.toJSON());
  } catch (e) {
    handle(e, res);
  }
}
