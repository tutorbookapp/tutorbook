import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import { Meeting, MeetingJSON, isMeetingJSON } from 'lib/model';
import getMatch from 'lib/api/get/match';
import getPeople from 'lib/api/get/people';
import { handle } from 'lib/api/error';
import updateMeetingDoc from 'lib/api/update/meeting-doc';
import updateMeetingSearchObj from 'lib/api/update/meeting-search-obj';
import updateZoom from 'lib/api/update/zoom';
import verifyAuth from 'lib/api/verify/auth';
import verifyBody from 'lib/api/verify/body';
import verifyTimeInAvailability from 'lib/api/verify/time-in-availability';

export type UpdateMeetingRes = MeetingJSON;

export default async function updateMeeting(
  req: Req,
  res: Res<UpdateMeetingRes>
): Promise<void> {
  try {
    const body = verifyBody<Meeting, MeetingJSON>(
      req.body,
      isMeetingJSON,
      Meeting
    );

    body.match = await getMatch(body.match.id);

    const people = await getPeople(body.match.people);

    // TODO: Update the time verification logic to account for recur rules.
    verifyTimeInAvailability(body.time, people);

    await verifyAuth(req.headers, {
      userIds: body.match.people.map((p) => p.id),
      orgIds: [body.match.org],
    });

    body.venue = await updateZoom(body, people);

    await updateMeetingDoc(body);
    await updateMeetingSearchObj(body);

    res.status(200).json(body.toJSON());
  } catch (e) {
    handle(e, res);
  }
}
