import { NextApiRequest, NextApiResponse } from 'next';
import to from 'await-to-js';

import { ApiError } from 'lib/model';
import { DecodedIdToken, auth } from 'lib/api/helpers/firebase';
import error from 'lib/api/helpers/error';

/**
 * GET - Fetches the profile data of the user who own's the given JWT.
 *
 * Requires a JWT; will return the profile data of that user.
 */
export default async function account(
  req: NextApiRequest,
  res: NextApiResponse<ApiError | void>
): Promise<void> {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method as string} Not Allowed`);
  } else if (typeof req.headers.authorization !== 'string') {
    error(res, 'You must provide a valid Firebase Auth JWT.', 401);
  } else {
    const [err, token] = await to<DecodedIdToken>(
      auth.verifyIdToken(req.headers.authorization.replace('Bearer ', ''), true)
    );
    if (err) {
      error(res, `Your Firebase Auth JWT is invalid: ${err.message}`, 401, err);
    } else {
      res.statusCode = 302;
      res.setHeader('Location', `/api/users/${(token as DecodedIdToken).uid}`);
      res.end();
    }
  }
}
