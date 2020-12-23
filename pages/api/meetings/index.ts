import { NextApiRequest, NextApiResponse } from 'next';

import listMeetings, { ListMeetingsRes } from 'lib/api/routes/meetings/list';
import { APIError } from 'lib/api/error';

/**
 * GET - Lists meetings (applying the given filters).
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
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${req.method as string} Not Allowed`);
  }
}
