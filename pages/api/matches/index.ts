import { NextApiRequest, NextApiResponse } from 'next';

import { ApiError } from 'lib/model';
import createMatch, { CreateMatchRes } from 'lib/api/create-match';
import listMatches, { ListMatchesRes } from 'lib/api/list-matches';

/**
 * GET - Lists the user's, their children's, or their org's matches.
 * POST - Creates a new match.
 *
 * Requires a JWT owned by an match person, their parents, or their org admin.
 */
export default async function matches(
  req: NextApiRequest,
  res: NextApiResponse<ListMatchesRes | CreateMatchRes | ApiError>
): Promise<void> {
  switch (req.method) {
    case 'GET': // List the user's, their children's, and their org's matches.
      await listMatches(req, res);
      break;
    case 'POST': // Create a new match.
      await createMatch(req, res);
      break;
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method as string} Not Allowed`);
  }
}
