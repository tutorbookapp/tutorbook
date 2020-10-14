import { NextApiRequest, NextApiResponse } from 'next';

import { APIError } from 'lib/api/error';
import listOrgs, { ListOrgsRes } from 'lib/api/routes/orgs/list';

/**
 * GET - Lists the orgs that the given user is a member of.
 *
 * Requires an authentication JWT.
 */
export default async function orgs(
  req: NextApiRequest,
  res: NextApiResponse<ListOrgsRes | APIError>
): Promise<void> {
  switch (req.method) {
    case 'GET': // Fetch the org's profile document.
      await listOrgs(req, res);
      break;
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${req.method as string} Not Allowed`);
  }
}
