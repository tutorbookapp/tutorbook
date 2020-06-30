import { NextApiRequest, NextApiResponse } from 'next';
import { ApiError } from 'lib/model';
import createRequest, { CreateRequestRes } from 'lib/api/create-request';

/**
 * POST - Creates a new request.
 *
 * Requires a JWT owned by one of the tutee or mentee attendees (i.e. the sender
 * of the request).
 */
export default async function requests(
  req: NextApiRequest,
  res: NextApiResponse<CreateRequestRes | ApiError>
): Promise<void> {
  switch (req.method) {
    case 'POST': // Create a new request.
      await createRequest(req, res);
      break;
    default:
      res.setHeader('Allow', ['POST']);
      res.status(405).end(`Method ${req.method as string} Not Allowed`);
  }
}
