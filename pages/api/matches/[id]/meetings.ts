import { NextApiRequest, NextApiResponse } from 'next';

import createMeeting, {
  CreateMeetingRes,
} from 'lib/api/routes/meetings/create';
import listMeetings, { ListMeetingsRes } from 'lib/api/routes/meetings/list';
import { APIError } from 'lib/api/error';

/**
 * GET - Lists the timeline of meetings for a given match.
 * POST - Creates a new match meeting (in our Firestore database).
 *
 * Requires JWT of org admin (meetingually, we'll also allow users to access their
 * own matches).
 */
export default async function meetings(
  req: NextApiRequest,
  res: NextApiResponse<ListMeetingsRes | CreateMeetingRes | APIError>
): Promise<void> {
  switch (req.method) {
    case 'GET':
      await listMeetings(req, res);
      break;
    case 'POST':
      await createMeeting(req, res);
      break;
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method as string} Not Allowed`);
  }
}
