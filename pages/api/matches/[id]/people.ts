import { NextApiRequest, NextApiResponse } from 'next';

import fetchPeople, { FetchPeopleRes } from 'lib/api/routes/people/fetch';
import { APIError } from 'lib/api/error';

/**
 * GET - Fetches the people data for a given match.
 *
 * Requires JWT of org admin (eventually, we'll also allow users to access their
 * own matches).
 */
export default async function people(
  req: NextApiRequest,
  res: NextApiResponse<FetchPeopleRes | APIError>
): Promise<void> {
  switch (req.method) {
    case 'GET':
      await fetchPeople(req, res);
      break;
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${req.method as string} Not Allowed`);
  }
}
