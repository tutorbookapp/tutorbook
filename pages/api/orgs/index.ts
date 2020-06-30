import { NextApiRequest, NextApiResponse } from 'next';
import { ApiError } from '@tutorbook/model';
import listOrgs, { ListOrgsRes } from '@tutorbook/api/list-orgs';

/**
 * GET - Lists the orgs that the given user is a member of.
 *
 * Requires an authentication JWT.
 */
export default async function orgs(
  req: NextApiRequest,
  res: NextApiResponse<ListOrgsRes | ApiError>
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
