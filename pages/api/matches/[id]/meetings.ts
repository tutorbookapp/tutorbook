import { NextApiRequest, NextApiResponse } from 'next';

import fetchMeetings, { FetchMeetingsRes } from 'lib/api/routes/meetings/fetch';
import { APIError } from 'lib/api/error';

/**
 * GET - Fetches the timeline of meetings for a given match. This is merely
 * provided for convenience and may be removed in favor of `/api/meetings`.
 *
 * Requires JWT of org admin (eventually, we'll also allow users to access their
 * own matches).
 */
export default async function meetings(
  req: NextApiRequest,
  res: NextApiResponse<FetchMeetingsRes | APIError>
): Promise<void> {
  switch (req.method) {
    case 'GET':
      await fetchMeetings(req, res);
      break;
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${req.method as string} Not Allowed`);
  }
}
