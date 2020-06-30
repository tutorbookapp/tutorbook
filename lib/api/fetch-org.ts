import { NextApiRequest, NextApiResponse } from 'next';
import { Org, OrgJSON } from 'lib/model';

import to from 'await-to-js';
import error from './helpers/error';

import { db, auth, DocumentSnapshot, DecodedIdToken } from './helpers/firebase';

export type FetchOrgRes = OrgJSON;

export default async function fetchOrg(
  req: NextApiRequest,
  res: NextApiResponse<FetchOrgRes>
): Promise<void> {
  if (typeof req.query.id !== 'string') {
    error(res, 'You must provide a valid user ID in your URL.');
  } else if (!req.headers.authorization) {
    error(res, 'You must provide a valid Firebase Auth JWT.', 401);
  } else {
    const [err, token] = await to<DecodedIdToken>(
      auth.verifyIdToken(req.headers.authorization.replace('Bearer ', ''), true)
    );
    if (err) {
      error(res, `Your Firebase Auth JWT is invalid: ${err.message}`, 401, err);
    } else {
      const doc: DocumentSnapshot = await db
        .collection('orgs')
        .doc(req.query.id)
        .get();
      const org: Org = Org.fromFirestore(doc);

      if (!doc.exists) {
        error(res, `Org (${req.query.id}) does not exist.`, 500);
      } else if (org.members.indexOf((token as DecodedIdToken).uid) < 0) {
        error(res, `You are not a member of ${org.toString()}.`, 401);
      } else {
        res.status(200).json(org.toJSON());
      }
    }
  }
}
