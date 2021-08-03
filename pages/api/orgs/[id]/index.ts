import { NextApiRequest, NextApiResponse } from 'next';

import { APIError } from 'lib/model/error';
import fetchOrg, { FetchOrgRes } from 'lib/api/routes/orgs/fetch';
import updateOrg, { UpdateOrgRes } from 'lib/api/routes/orgs/update';

/**
 * GET - Fetches the org's profile document.
 * PUT - Updates the org's profile document.
 *
 * Requires an authentication JWT belonging to a member of the org in question.
 */
export default async function org(
  req: NextApiRequest,
  res: NextApiResponse<FetchOrgRes | UpdateOrgRes | APIError>
): Promise<void> {
  switch (req.method) {
    case 'GET': // Fetch the org's profile document.
      await fetchOrg(req, res);
      break;
    case 'PUT': // Update the org's profile document.
      await updateOrg(req, res);
      break;
    default:
      res.setHeader('Allow', ['GET', 'PUT']);
      res.status(405).end(`Method ${req.method as string} Not Allowed`);
  }
}
