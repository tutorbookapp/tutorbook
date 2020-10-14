import { NextApiRequest as Req, NextApiResponse as Res } from 'next';

import { handle } from 'lib/api/error';
import verifyAuth from 'lib/api/verify/auth';

/**
 * GET - Fetches the profile data of the user who own's the given JWT.
 *
 * Requires a JWT; will return the profile data of that user.
 */
export default async function account(req: Req, res: Res): Promise<void> {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method as string} Not Allowed`);
  } else {
    try {
      const uid = await verifyAuth(req.headers);
      res.statusCode = 302;
      res.setHeader('Location', `/api/users/${uid}`);
      res.end();
    } catch (e) {
      handle(e, res);
    }
  }
}
