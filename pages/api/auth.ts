import { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import axios, { AxiosResponse } from 'axios';
import to from 'await-to-js';

import { APIError, handle } from 'lib/api/error';
import { DocumentSnapshot, db } from 'lib/api/firebase';

interface ZoomToken {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
}

interface ZoomUser {
  id: string;
  account_id: string;
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
async function authorize(req: Req, res: Res<void>): Promise<void> {
  if (typeof req.query.org !== 'string') {
    throw new APIError('Missing org ID in the `org` query param.', 400);
  } else if (typeof req.query.code !== 'string') {
    throw new APIError('Missing OAuth code in the `code` query param.', 400);
  } else if (!req.headers.host || !req.url) {
    throw new APIError('Missing Zoom redirect link in host and url.', 400);
  } else {
    // 1. Request an access token using the Zoom OAuth code.
    const redirect = new URL(req.url, `http://${req.headers.host}/`);
    redirect.searchParams.delete('code');
    const [err, token] = await to<AxiosResponse<ZoomToken>>(
      axios({
        method: 'post',
        url:
          `https://zoom.us/oauth/token?grant_type=authorization_code&code=` +
          `${req.query.code}&redirect_uri=${encodeURIComponent(redirect.href)}`,
        auth: {
          username: process.env.ZOOM_CLIENT_ID as string,
          password: process.env.ZOOM_CLIENT_KEY as string,
        },
      })
    );
    if (err) {
      throw new APIError(`${err.name} calling OAuth API: ${err.message}`, 500);
    } else {
      // 2. Get the Zoom account ID by fetching the user's Zoom data.
      const {
        access_token: accessToken,
        refresh_token: refreshToken,
      } = (token as AxiosResponse<ZoomToken>).data;
      const [e, user] = await to<AxiosResponse<ZoomUser>>(
        axios.get('https://api.zoom.us/v2/users/me', {
          headers: { authorization: `Bearer ${accessToken}` },
        })
      );
      if (e) {
        throw new APIError(`${e.name} calling User API: ${e.message}`, 500);
      } else {
        // 3. Store the Zoom refresh token in the org's Firestore document.
        const { account_id: accountId } = (user as AxiosResponse<
          ZoomUser
        >).data;
        await db
          .collection('orgs')
          .doc(req.query.org)
          .update({ zoom: { id: accountId, token: refreshToken } });
        // 4. Redirect the user back to our app (where they started).
        res.statusCode = 302;
        res.setHeader('Location', req.query.redirect || '/dashboard');
        res.end();
      }
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
 * 2. Removes the Zoom refresh token from any orgs that use the given account.
 * 3. Notifies Zoom that the account data has been removed by calling their
 *    Data Compliance API.
 * @see {@link https://marketplace.zoom.us/docs/guides/publishing/data-compliance}
 * @see {@link https://marketplace.zoom.us/docs/guides/auth/deauthorization}
 * @see {@link https://github.com/tutorbookapp/tutorbook/issues/100}
 */
async function deauthorize(req: Req, res: Res<void>): Promise<void> {
  if (req.headers.authorization !== process.env.ZOOM_TOKEN) {
    // 1. Verify that the request actually came from Zoom.
    throw new APIError('Invalid authorization header.', 401);
  } else if (!isZoomEvent(req.body)) {
    throw new APIError('Missing request body w/ a deauthorization event.', 400);
  } else {
    // 2. Remove the Zoom refresh token from org data.
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
    // 3. Notify Zoom that we're data compliant.
    const [err] = await to(
      axios({
        method: 'post',
        url: 'https://api.zoom.us/oauth/data/compliance',
        auth: {
          username: process.env.ZOOM_CLIENT_ID as string,
          password: process.env.ZOOM_CLIENT_KEY as string,
        },
        data: {
          client_id: req.body.payload.client_id,
          user_id: req.body.payload.user_id,
          account_id: req.body.payload.account_id,
          deauthorization_event_received: req.body.payload,
          compliance_completed: true,
        },
      })
    );
    if (err) {
      throw new APIError(
        `${err.name} calling Compliance API: ${err.message}`,
        500
      );
    } else {
      res.status(200).end();
    }
  }
}

/**
 * GET - Adds a new Zoom OAuth refresh token to an org's account.
 * POST - Removes a Zoom OAuth refresh token from an org's account.
 *
 * Currently, this doesn't require any authentication claims. We might add a JWT
 * requirement for the GET endpoint... but there isn't one right now.
 */
export default async function auth(req: Req, res: Res<void>): Promise<void> {
  try {
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
  } catch (e) {
    handle(e, res);
  }
}
