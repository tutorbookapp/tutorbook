import { NextApiRequest, NextApiResponse } from 'next';

import fetchAvailability, {
  FetchAvailabilityRes,
} from 'lib/api/routes/availability/fetch';
import { APIError } from 'lib/model/error';

/**
 * GET - Fetches the requested user's availability.
 *
 * Requires no authentication (unless the user's profile isn't public).
 */
export default async function availability(
  req: NextApiRequest,
  res: NextApiResponse<FetchAvailabilityRes | APIError>
): Promise<void> {
  switch (req.method) {
    case 'GET':
      await fetchAvailability(req, res);
      break;
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${req.method as string} Not Allowed`);
  }
}
