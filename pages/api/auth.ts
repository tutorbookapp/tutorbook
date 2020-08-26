import { NextApiRequest, NextApiResponse } from 'next';
import axios, { AxiosResponse } from 'axios';
import to from 'await-to-js';

import { db, DocumentSnapshot } from 'lib/api/helpers/firebase';
import error from 'lib/api/helpers/error';

interface ZoomToken {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
}

/**
 * Given an authorization code supplied by the Zoom OAuth redirect and an org
 * supplied by our app before the user was redirected, this API endpoint:
 * 1. Requests an access token using the Zoom OAuth code.
 * 2. Uses that access token to get the user's Zoom account info. We need this
 *    to be able to remove the data when Zoom sends us deauthorization events.
 * 3. Stores the Zoom refresh token (along with their account ID) in the org's
 *    Firestore document.
 * 4. Redirects the user back to our app (where they started).
 * @todo Implement step #2 (get the org's Zoom `account_id` and add it to the
 * Firestore document).
 * @see {@link https://marketplace.zoom.us/docs/guides/auth/oauth}
 * @see {@link https://marketplace.zoom.us/docs/api-reference/using-zoom-apis#using-oauth}
 * @see {@link https://github.com/tutorbookapp/tutorbook/issues/100}
 */
async function authorize(
  req: NextApiRequest,
  res: NextApiResponse<void>
): Promise<void> {
  if (typeof req.query.org !== 'string') {
    error(res, 'You must provide an org ID using the `org` query param.');
  } else if (typeof req.query.code !== 'string') {
    error(res, 'You must provide an OAuth code using the `code` query param.');
  } else if (!req.headers.host || !req.url) {
    error(res, 'No request hostname nor URL to derive the Zoom redirect link.');
  } else {
    // 1. Request an access token using the Zoom OAuth code.
    const redirect = new URL(req.url, `http://${req.headers.host}/`);
    redirect.searchParams.delete('code');
    const [err, token] = await to<AxiosResponse<ZoomToken>>(
      axios({
        url:
          `https://zoom.us/oauth/token?grant_type=authorization_code&code=` +
          `${req.query.code}&redirect_uri=${encodeURIComponent(redirect.href)}`,
        method: 'post',
        auth: {
          username: process.env.ZOOM_CLIENT_ID as string,
          password: process.env.ZOOM_CLIENT_KEY as string,
        },
      })
    );
    if (err) {
      error(res, `${err.name} calling Zoom token API: ${err.message}`, 500);
    } else {
      // 2. Store the Zoom refresh token in the org's Firestore document.
      await db
        .collection('orgs')
        .doc(req.query.org)
        .update({
          zoom: (token as AxiosResponse<ZoomToken>).data.refresh_token,
        });
      // 3. Redirect the user back to our app (where they started).
      res.statusCode = 302;
      res.setHeader('Location', req.query.redirect || '/dashboard');
      res.end();
    }
  }
}

interface ZoomEvent {
  event: 'app_deauthorized';
  payload: {
    user_data_retention: boolean;
    account_id: string;
    user_id: string;
    signature: string;
    deauthorization_time: string;
    client_id: string;
  };
}

function isZoomEvent(evt: any): evt is ZoomEvent {
  if (typeof evt !== 'object') return false;
  if ((evt as { event?: unknown }).event !== 'app_deauthorized') return false;
  if ((evt as { payload?: unknown }).payload !== 'object') return false;
  const p = (evt as { payload: Record<string, unknown> }).payload;
  if (typeof p.user_data_retention !== 'boolean') return false;
  if (typeof p.account_id !== 'string') return false;
  if (typeof p.user_id !== 'string') return false;
  if (typeof p.signature !== 'string') return false;
  if (typeof p.deauthorization_time !== 'string') return false;
  if (typeof p.client_id !== 'string') return false;
  return true;
}

/**
 * Given a deauthorization event notification supplied by Zoom via an HTTP POST
 * request, this API endpoint:
 * 1. Verify that the request actually came from Zoom by checking that the
 *    verification token is as expected (this is to prevent DOS attacks).
 * 2. Removes the Zoom refresh token from the any orgs that use the given
 *    account ID.
 * @see {@link https://marketplace.zoom.us/docs/guides/auth/deauthorization}
 * @see {@link https://github.com/tutorbookapp/tutorbook/issues/100}
 */
async function deauthorize(
  req: NextApiRequest,
  res: NextApiResponse<void>
): Promise<void> {
  if (req.headers.authorization !== process.env.ZOOM_TOKEN) {
    error(res, 'Invalid authorization header.', 401);
  } else if (!isZoomEvent(req.body)) {
    error(res, 'You must provide a request body w/ a deauthorization event.');
  } else {
    const orgs = (
      await db
        .collection('orgs')
        .where('zoom.id', '==', req.body.payload.account_id)
        .get()
    ).docs;
    await Promise.all(
      orgs.map(async (org: DocumentSnapshot) => {
        const prev = org.data() || {};
        delete prev.zoom;
        await org.ref.set(prev);
      })
    );
    res.status(200).end();
  }
}

/**
 * GET - Adds a new Zoom OAuth refresh token to an org's account.
 * POST - Removes a Zoom OAuth refresh token from an org's account.
 *
 * Currently, this doesn't require any authentication claims. We might add a JWT
 * requirement for the GET endpoint... but there isn't one right now.
 */
export default async function auth(
  req: NextApiRequest,
  res: NextApiResponse<void>
): Promise<void> {
  switch (req.method) {
    case 'GET': // Add a new Zoom OAuth refresh token to an org's account.
      await authorize(req, res);
      break;
    case 'POST': // Remove a Zoom OAuth refresh token from an org's account.
      await deauthorize(req, res);
      break;
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method as string} Not Allowed`);
  }
}
