import { NextApiRequest, NextApiResponse } from 'next';

import deleteMatch, { DeleteMatchRes } from 'lib/api/routes/matches/delete';
import fetchMatch, { FetchMatchRes } from 'lib/api/routes/matches/fetch';
import updateMatch, { UpdateMatchRes } from 'lib/api/routes/matches/update';
import { APIError } from 'lib/model/error';

/**
 * GET - Fetches the match (from our Firestore database).
 * PUT - Updates the match (in Algolia, Firebase Auth, and Firestore).
 * DELETE - Deletes the match (from Algolia, Firebase Auth, and Firestore).
 *
 * All those methods require an authentication JWT of either:
 * 1. The match whose document is being updated or;
 * 2. A member of an organization that the document belongs to.
 */
export default async function match(
  req: NextApiRequest,
  res: NextApiResponse<
    FetchMatchRes | UpdateMatchRes | DeleteMatchRes | APIError
  >
): Promise<void> {
  switch (req.method) {
    case 'GET':
      await fetchMatch(req, res);
      break;
    case 'PUT':
      await updateMatch(req, res);
      break;
    case 'DELETE':
      await deleteMatch(req, res);
      break;
    default:
      res.setHeader('Allow', ['PUT', 'DELETE']);
      res.status(405).end(`Method ${req.method as string} Not Allowed`);
  }
}
