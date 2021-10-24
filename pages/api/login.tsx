import { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import to from 'await-to-js';

import { FirebaseError, auth } from 'lib/api/firebase';
import { APIError } from 'lib/model/error';
import { handle } from 'lib/api/error';
import { isJSON } from 'lib/model/json';
import mail from 'lib/mail/login';

async function sendLoginLink(req: Req, res: Res<void>): Promise<void> {
  if (!isJSON(req.body)) throw new APIError('Invalid request body', 400);
  if (typeof req.body.email !== 'string')
    throw new APIError('Request body must contain an email', 400);
  if (typeof req.body.location !== 'string')
    throw new APIError('Request body must contain a location', 400);
  if (typeof req.body.redirect !== 'string')
    throw new APIError('Request body must contain a redirect', 400);
  const actionCodeSettings = {
    url: `http://${
      req.headers.host || 'tutorbook.org'
    }/confirm?href=${encodeURIComponent(req.body.redirect)}`,
  };
  const [err, link] = await to<string, FirebaseError>(
    auth.generateSignInWithEmailLink(req.body.email, actionCodeSettings)
  );
  if (err) throw new APIError(`${err.name} creating link: ${err.message}`, 500);
  await mail(req.body.email, req.body.location, link as string);
  res.status(200).end();
}

/**
 * POST - Generates and sends a login link to the given email address.
 *
 * Requires no authentication (as this is used to login users).
 * @see {@link https://firebase.google.com/docs/auth/web/email-link-auth}
 * @see {@link https://bit.ly/3lILiMs}
 */
export default async function login(req: Req, res: Res<void>): Promise<void> {
  try {
    switch (req.method) {
      case 'POST':
        await sendLoginLink(req, res);
        break;
      default:
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method as string} Not Allowed`);
    }
  } catch (e) {
    handle(e, res);
  }
}
