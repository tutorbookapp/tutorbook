import { NextApiRequest, NextApiResponse } from 'next';
import { User, Org } from 'lib/model';

import to from 'await-to-js';
import error from './error';

import { db, auth, DecodedIdToken, DocumentSnapshot } from './firebase';

export default async function verify(
  req: NextApiRequest,
  res: NextApiResponse,
  user: User,
  action: () => Promise<void> | void
): Promise<void> {
  if (typeof req.headers.authorization !== 'string') {
    error(res, 'You must provide a valid JWT authorization header.', 401);
  } else {
    const [err, token] = await to<DecodedIdToken>(
      auth.verifyIdToken(req.headers.authorization.replace('Bearer ', ''), true)
    );
    if (err) {
      error(res, `Your JWT is invalid: ${err.message}`, 401, err);
    } else {
      const { uid } = token as DecodedIdToken;
      if (user.id === uid) {
        await action();
      } else {
        const orgs: Org[] = (
          await db
            .collection('orgs')
            .where('members', 'array-contains', uid)
            .get()
        ).docs.map((org: DocumentSnapshot) => Org.fromFirestore(org));
        if (orgs.every((org: Org) => user.orgs.indexOf(org.id) < 0)) {
          error(res, `${user.toString()} is not part of your orgs.`, 401);
        } else {
          await action();
        }
      }
    }
  }
}
