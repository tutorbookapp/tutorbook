import { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import to from 'await-to-js';

import { APIError, handle } from 'lib/api/error';
import { Match, Meeting, MeetingJSON, isMeetingJSON } from 'lib/model';
import createMatchDoc from 'lib/api/create/match-doc';
import createMatchSearchObj from 'lib/api/create/match-search-obj';
import createMeetingDoc from 'lib/api/create/meeting-doc';
import createMeetingSearchObj from 'lib/api/create/meeting-search-obj';
import createZoom from 'lib/api/create/zoom';
import getMatch from 'lib/api/get/match';
import getOrg from 'lib/api/get/org';
import getPeople from 'lib/api/get/people';
import getPerson from 'lib/api/get/person';
import getStudents from 'lib/api/get/students';
import verifyAuth from 'lib/api/verify/auth';
import verifyBody from 'lib/api/verify/body';
import verifyIsOrgAdmin from 'lib/api/verify/is-org-admin';
import verifySubjectsCanBeTutored from 'lib/api/verify/subjects-can-be-tutored';
import verifyTimeInAvailability from 'lib/api/verify/time-in-availability';

export type CreateMeetingRes = MeetingJSON;

export default async function createMeeting(
  req: Req,
  res: Res<CreateMeetingRes>
): Promise<void> {
  try {
    const body = verifyBody<Meeting, MeetingJSON>(
      req.body,
      isMeetingJSON,
      Meeting
    );
    const people = await getPeople(body.match.people);

    // TODO: Update the time verification logic to account for recur rules.
    verifyTimeInAvailability(body.time, people);
    verifySubjectsCanBeTutored(body.match.subjects, people);

    const org = await getOrg(body.match.org);
    const creator = await getPerson(body.creator, people);
    await verifyAuth(req.headers, { orgIds: [org.id] });

    // Verify the creator exists, is sending an authorized request, and:
    // - The creator is also the creator of the meeting's match (in which case
    //   we perform the match creator verification), OR;
    // - The meeting's match already exists (i.e. was created by someone else)
    //   and the creator is one of the original match people or an org admin.
    const [matchDoesntExist, originalMatch] = await to(getMatch(body.match.id));
    if (matchDoesntExist) {
      // Meeting creator is also the match creator.
      if (creator.id !== body.match.creator.id) {
        const msg = `You must be the match creator (${body.match.creator.id})`;
        throw new APIError(msg, 401);
      }

      // Verify the match creator is:
      // a) The match student him/herself, OR;
      // b) Admin of the match's org (e.g. Gunn High School).
      const studentIds = getStudents(people).map((p) => p.id);
      if (!studentIds.includes(creator.id)) verifyIsOrgAdmin(org, creator.id);

      // Create match (b/c it doesn't already exist).
      body.match = await createMatchDoc(body.match);
      await createMatchSearchObj(body.match);
    } else {
      // Match org cannot change (security issue if it can).
      // TODO: Shouldn't the match people be restricted too?
      if ((originalMatch as Match).org !== body.match.org) {
        const msg = `Match org (${org.toString()}) cannot change`;
        throw new APIError(msg, 400);
      }

      // Verify the meeting creator is:
      // a) One of the original match people, OR;
      // b) Admin of the original match's org (e.g. Gunn High School).
      const peopleIds = (originalMatch as Match).people.map((p) => p.id);
      if (!peopleIds.includes(creator.id)) verifyIsOrgAdmin(org, creator.id);
    }

    body.venue = await createZoom(body, people);
    const meeting = await createMeetingDoc(body);
    await createMeetingSearchObj(meeting);

    res.status(200).json(meeting.toJSON());
  } catch (e) {
    handle(e, res);
  }
}
