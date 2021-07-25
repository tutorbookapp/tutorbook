import { NextApiRequest, NextApiResponse } from 'next';

import createUser, { CreateUserRes } from 'lib/api/routes/users/create';
import listUsers, { ListUsersRes } from 'lib/api/routes/users/list';
import { APIError } from 'lib/api/error';

/**
 * GET - Lists all of Tutorbook's users (applying the given filters).
 * POST - Creates a new user.
 *
 * Requires no authentication. One can provide a JWT when performing a `GET`
 * request to receive un-truncated data (i.e. data with contact information),
 * but it's completely optional and only used for org admin dashboards.
 */
export default async function users(
  req: NextApiRequest,
  res: NextApiResponse<ListUsersRes | CreateUserRes | APIError>
): Promise<void> {
  switch (req.method) {
    case 'GET': // List all of Tutorbook's users (applying filters).
      await listUsers(req, res);
      break;
    case 'POST': // Create a new user.
      await createUser(req, res);
      break;
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method as string} Not Allowed`);
  }
}
