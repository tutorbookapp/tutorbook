import { NextApiRequest, NextApiResponse } from 'next';
import { ApiError } from '@tutorbook/model';
import fetchUser, { FetchUserRes } from '@tutorbook/api/fetch-user';
import updateUser, { UpdateUserRes } from '@tutorbook/api/update-user';

/**
 * GET - Fetches the user's profile document.
 * PUT - Updates the user's profile document.
 *
 * All those methods require an authentication JWT of either:
 * 1. The user whose profile document is being updated or;
 * 2. A member of an organization that the profile document belongs to.
 */
export default async function user(
  req: NextApiRequest,
  res: NextApiResponse<FetchUserRes | UpdateUserRes | DeleteUserRes | ApiError>
): Promise<void> {
  switch (req.method) {
    case 'GET': // Fetch the user's profile document.
      await fetchUser(req, res);
      break;
    case 'PUT': // Update the user's profile document.
      await updateUser(req, res);
      break;
    default:
      res.setHeader('Allow', ['GET', 'PUT']);
      res.status(405).end(`Method ${req.method as string} Not Allowed`);
  }
}
