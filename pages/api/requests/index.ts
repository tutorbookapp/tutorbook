import { NextApiRequest, NextApiResponse } from 'next';

import { ApiError } from 'lib/model';
import createRequest, { CreateRequestRes } from 'lib/api/create-request';
import listRequests, { ListRequestsRes } from 'lib/api/list-requests';

/**
 * GET - Lists the user's, their children's, or their org's requests.
 * POST - Creates a new request.
 *
 * Requires a JWT owned by a request person, their parents, or their org admin.
 */
export default async function matches(
  req: NextApiRequest,
  res: NextApiResponse<ListRequestsRes | CreateRequestRes | ApiError>
): Promise<void> {
  switch (req.method) {
    case 'GET': // List the user's, their children's, and their org's requests.
      await listRequests(req, res);
      break;
    case 'POST': // Create a new request.
      await createRequest(req, res);
      break;
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method as string} Not Allowed`);
  }
}
