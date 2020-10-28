import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import {
  AvailabilityJSON,
  Timeslot,
  TimeslotURL,
  isTimeslotURL,
} from 'lib/model';
import { handle } from 'lib/api/error';
import getAvailability from 'lib/api/get/availability';
import verifyQuery from 'lib/api/verify/query';
import verifyQueryId from 'lib/api/verify/query-id';

export type FetchAvailabilityRes = AvailabilityJSON;

/**
 * Fetches a given user's availability (an array of 30 min timeslots in 15 min
 * increments for the requested time range).
 */
export default async function fetchAvailability(
  req: Req,
  res: Res<FetchAvailabilityRes>
): Promise<void> {
  try {
    const id = verifyQueryId(req.query);
    const range = verifyQuery<Timeslot, TimeslotURL>(
      req.query,
      isTimeslotURL,
      Timeslot
    );
    const availability = await getAvailability(id, range.from, range.to);
    res.status(200).json(availability.toJSON());
  } catch (e) {
    handle(e, res);
  }
}
