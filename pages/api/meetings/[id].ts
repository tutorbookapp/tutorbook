import { NextApiRequest, NextApiResponse } from 'next';

import deleteMeeting, {
  DeleteMeetingRes,
} from 'lib/api/routes/meetings/delete';
import updateMeeting, {
  UpdateMeetingRes,
} from 'lib/api/routes/meetings/update';
import { APIError } from 'lib/api/error';

/**
 * PUT - Updates a meeting. Errors if the meeting's match data does not match
 * what is in our Firestore database (match must be updated first).
 * DELETE - Deletes (cancels) a meeting.
 *
 * Requires JWT of an org admin or a person on the meeting's match.
 */
export default async function meetings(
  req: NextApiRequest,
  res: NextApiResponse<DeleteMeetingRes | UpdateMeetingRes | APIError>
): Promise<void> {
  switch (req.method) {
    case 'DELETE':
      await deleteMeeting(req, res);
      break;
    case 'PUT':
      await updateMeeting(req, res);
      break;
    default:
      res.setHeader('Allow', ['DELETE', 'PUT']);
      res.status(405).end(`Method ${req.method as string} Not Allowed`);
  }
}
