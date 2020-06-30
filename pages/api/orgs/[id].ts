import { NextApiRequest, NextApiResponse } from 'next';
import { ApiError } from 'lib/model';
import fetchOrg, { FetchOrgRes } from 'lib/api/fetch-org';

/**
 * GET - Fetches the org's profile document.
 *
 * Requires an authentication JWT belonging to a member of the org in question.
 */
export default async function org(
  req: NextApiRequest,
  res: NextApiResponse<FetchOrgRes | ApiError>
): Promise<void> {
  switch (req.method) {
    case 'GET': // Fetch the org's profile document.
      await fetchOrg(req, res);
      break;
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${req.method as string} Not Allowed`);
  }
}
