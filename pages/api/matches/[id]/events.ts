import { NextApiRequest, NextApiResponse } from 'next';

import fetchEvents, { FetchEventsRes } from 'lib/api/routes/events/fetch';
import { APIError } from 'lib/api/error';

/**
 * GET - Fetches the timeline of events for a given match.
 *
 * Requires JWT of org admin (eventually, we'll also allow users to access their
 * own matches).
 */
export default async function availability(
  req: NextApiRequest,
  res: NextApiResponse<FetchEventsRes | APIError>
): Promise<void> {
  switch (req.method) {
    case 'GET':
      await fetchEvents(req, res);
      break;
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${req.method as string} Not Allowed`);
  }
}
