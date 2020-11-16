import { NextApiRequest, NextApiResponse } from 'next';

import deleteUser, { DeleteUserRes } from 'lib/api/routes/users/delete';
import fetchUser, { FetchUserRes } from 'lib/api/routes/users/fetch';
import updateUser, { UpdateUserRes } from 'lib/api/routes/users/update';
import { APIError } from 'lib/api/error';

/**
 * GET - Fetches the user (from our Firestore database).
 * PUT - Updates the user (in Algolia, Firebase Auth, and Firestore).
 * DELETE - Deletes the user (from Algolia, Firebase Auth, and Firestore);
 *
 * All those methods require an authentication JWT of either:
 * 1. The user whose profile document is being updated or;
 * 2. A member of an organization that the profile document belongs to.
 */
export default async function user(
  req: NextApiRequest,
  res: NextApiResponse<FetchUserRes | UpdateUserRes | DeleteUserRes | APIError>
): Promise<void> {
  switch (req.method) {
    case 'GET':
      await fetchUser(req, res);
      break;
    case 'PUT':
      await updateUser(req, res);
      break;
    case 'DELETE':
      await deleteUser(req, res);
      break;
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${req.method as string} Not Allowed`);
  }
}
