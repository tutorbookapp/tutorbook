import { NextApiRequest, NextApiResponse } from 'next';

import createMeeting, {
  CreateMeetingRes,
} from 'lib/api/routes/meetings/create';
import listMeetings, { ListMeetingsRes } from 'lib/api/routes/meetings/list';
import { APIError } from 'lib/model/error';

/**
 * GET - Lists meetings (applying the given filters).
 * POST - Creates a new meeting. Errors if the meeting's match data does not
 * match what is found in our Firestore database (match must already exist).
 *
 * Requires JWT of an org admin or a specific user (depending on filters).
 *
 * @todo Combine this and the `/api/matches/[id]/meetings` endpoint or
 * distinguish why we need both endpoints.
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
