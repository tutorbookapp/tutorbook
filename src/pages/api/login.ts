import { NextApiRequest, NextApiResponse } from 'next';

/**
 * Authentication tokens are passed from the client to the server on each
 * request. This way, we can SSR pages containing user-specific data **and** use
 * the default `serverless` Next.js paradigm.
 * @see {@link https://auth0.com/blog/ultimate-guide-nextjs-authentication-auth0/}
 * @see {@link https://nextjs.org/docs/api-reference/next.config.js/build-target#serverless-target}
 */
export default function login(
  req: NextApiRequest,
  res: NextApiResponse<void>
): void {
  if (!req.body) return res.status(400);
  const token: string | undefined = req.body.token;
  firebase
    .auth()
    .verifyIdToken(token)
    .then((decodedToken) => {
      req.session.decodedToken = decodedToken;
      return decodedToken;
    })
    .then((decodedToken) => res.status(200).json(decodedToken))
    .catch((error) => {
      res.status(error.status || 500).send(error.message);
    });
}
