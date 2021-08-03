import { NextApiRequest, NextApiResponse } from 'next';

import createOrg, { CreateOrgRes } from 'lib/api/routes/orgs/create';
import listOrgs, { ListOrgsRes } from 'lib/api/routes/orgs/list';
import { APIError } from 'lib/model/error';

/**
 * GET - Lists the orgs that the given user is a member of.
 * POST - Creates a new org (the given user must be a member).
 *
 * Requires an authentication JWT.
 */
export default async function orgs(
  req: NextApiRequest,
  res: NextApiResponse<ListOrgsRes | CreateOrgRes | APIError>
): Promise<void> {
  switch (req.method) {
    case 'GET': // Fetch the org's profile document.
      await listOrgs(req, res);
      break;
    case 'POST': // Create a new org.
      await createOrg(req, res);
      break;
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method as string} Not Allowed`);
  }
}
