import { NextApiRequest, NextApiResponse } from 'next';

import updateMatch, { UpdateMatchRes } from 'lib/api/routes/matches/update';
import { APIError } from 'lib/api/error';

/**
 * PUT - Updates the match (in Algolia, Firebase Auth, and Firestore).
 *
 * All those methods require an authentication JWT of either:
 * 1. The match whose document is being updated or;
 * 2. A member of an organization that the document belongs to.
 */
export default async function match(
  req: NextApiRequest,
  res: NextApiResponse<UpdateMatchRes | APIError>
): Promise<void> {
  switch (req.method) {
    case 'PUT':
      await updateMatch(req, res);
      break;
    default:
      res.setHeader('Allow', ['PUT']);
      res.status(405).end(`Method ${req.method as string} Not Allowed`);
  }
}
