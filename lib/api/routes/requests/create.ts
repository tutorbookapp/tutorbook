import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import { Request, RequestJSON, isRequestJSON } from 'lib/model';
import { handle } from 'lib/api/error';
import createRequestDoc from 'lib/api/create/request-doc';
import getOrgsByAdminId from 'lib/api/get/orgs-by-admin-id';
import getPeople from 'lib/api/get/people';
import getPerson from 'lib/api/get/person';
import getStudents from 'lib/api/get/students';
import verifyAuth from 'lib/api/verify/auth';
import verifyBody from 'lib/api/verify/body';
import verifyOrgs from 'lib/api/verify/orgs';
import verifySubjectsCanBeTutored from 'lib/api/verify/subjects-can-be-tutored';
import verifyTimesInAvailability from 'lib/api/verify/times-in-availability';

export type CreateRequestRes = RequestJSON;

/**
 * Creates a new request: A job post, typically created by parents or teachers.
 * @todo Don't error when a creator is unavailable during the requested times
 * (or, even better, add this timeslot to their availability and then remove it
 * during post-creation logic).
 * @todo Reduce code duplication between the `createMatch` API endpoint logic.
 */
export default async function createRequest(
  req: Req,
  res: Res<CreateRequestRes>
): Promise<void> {
  try {
    const body = verifyBody<Request, RequestJSON>(
      req.body,
      isRequestJSON,
      Request
    );
    const people = await getPeople(body.people);

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

    const request = await createRequestDoc(body);

    res.status(201).json(request.toJSON());
  } catch (e) {
    handle(e, res);
  }
}
