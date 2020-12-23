import { NextApiRequest, NextApiResponse } from 'next';

import createMeeting, {
  CreateMeetingRes,
} from 'lib/api/routes/meetings/create';
import fetchMeetings, { FetchMeetingsRes } from 'lib/api/routes/meetings/fetch';
import { APIError } from 'lib/api/error';

/**
 * GET - Fetches the timeline of meetings for a given match.
 * POST - Creates a new match meeting (typically called right after creating the
 * match itself or sometimes by the student after an admin creates the match).
 *
 * Requires JWT of org admin (eventually, we'll also allow users to access their
 * own matches).
 */
export default async function meetings(
  req: NextApiRequest,
  res: NextApiResponse<FetchMeetingsRes | CreateMeetingRes | APIError>
): Promise<void> {
  switch (req.method) {
    case 'GET':
      await fetchMeetings(req, res);
      break;
    case 'POST':
      await createMeeting(req, res);
      break;
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method as string} Not Allowed`);
  }
}
