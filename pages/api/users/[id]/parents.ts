import { NextApiRequest, NextApiResponse } from 'next';
import { ApiError } from 'lib/model';
import createParent, { CreateParentRes } from 'lib/api/create-parent';

/**
 * POST - Creates a new parent profile and adds it to the user's `parents`.
 *
 * Requires an authentication JWT of either:
 * 1. The user whose profile document is being updated or;
 * 2. A member of an organization that the profile document belongs to.
 */
export default async function parents(
  req: NextApiRequest,
  res: NextApiResponse<CreateParentRes | ApiError>
): Promise<void> {
  switch (req.method) {
    case 'POST': // Create a new parent and add it to the user's `parents`.
      await createParent(req, res);
      break;
    default:
      res.setHeader('Allow', ['POST']);
      res.status(405).end(`Method ${req.method as string} Not Allowed`);
  }
}
