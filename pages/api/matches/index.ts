import { NextApiRequest, NextApiResponse } from 'next';

import { APIError } from 'lib/api/error';
import createMatch, { CreateMatchRes } from 'lib/api/routes/matches/create';
import listMatches, { ListMatchesRes } from 'lib/api/routes/matches/list';

/**
 * GET - Lists the user's, their children's, or their org's matches.
 * POST - Creates a new match.
 *
 * Requires a JWT owned by an match person, their parents, or their org admin.
 */
export default async function matches(
  req: NextApiRequest,
  res: NextApiResponse<ListMatchesRes | CreateMatchRes | APIError>
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
