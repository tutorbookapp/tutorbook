import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import { EventJSON, eventToJSON } from 'lib/model';
import getEvents from 'lib/api/get/events';
import getMatch from 'lib/api/get/match';
import { handle } from 'lib/api/error';
import verifyAuth from 'lib/api/verify/auth';
import verifyQueryId from 'lib/api/verify/query-id';

export type FetchEventsRes = EventJSON[];

export default async function fetchEvents(
  req: Req,
  res: Res<FetchEventsRes>
): Promise<void> {
  try {
    const id = verifyQueryId(req.query);
    const [match, events] = await Promise.all([getMatch(id), getEvents(id)]);

    // TODO: Right now this only responds to admin requests but we want it to
    // respond to any of the match's people as well.
    await verifyAuth(req.headers, { orgIds: [match.org] });

    res.status(200).json(events.map(eventToJSON));
  } catch (e) {
    handle(e, res);
  }
}
