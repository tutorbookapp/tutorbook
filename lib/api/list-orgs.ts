import { NextApiRequest, NextApiResponse } from 'next';
import { Org, OrgJSON } from 'lib/model';

import to from 'await-to-js';

import { db, auth, DecodedIdToken, DocumentSnapshot } from './helpers/firebase';

import error from './helpers/error';

export type ListOrgsRes = OrgJSON[];

/**
 * Lists all of the organizations that the given user JWT is a member of.
 *
 * @return {OrgJSON[]} All of the organizations that the user is a member of.
 */
export default async function listOrgs(
  req: NextApiRequest,
  res: NextApiResponse<ListOrgsRes>
): Promise<void> {
  if (!req.headers.authorization) {
    error(res, 'You must provide a valid auth JWT.', 401);
  } else {
    const [err, token] = await to<DecodedIdToken>(
      auth.verifyIdToken(req.headers.authorization.replace('Bearer ', ''), true)
    );
    if (err) {
      error(res, `${err.name} validating JWT: ${err.message}`, 401);
    } else {
      const orgs: OrgJSON[] = (
        await db
          .collection('orgs')
          .where('members', 'array-contains', (token as DecodedIdToken).uid)
          .get()
      ).docs.map((org: DocumentSnapshot) => Org.fromFirestore(org).toJSON());
      res.status(200).json(orgs);
    }
  }
}
