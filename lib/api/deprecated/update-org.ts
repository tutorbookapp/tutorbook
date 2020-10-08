import { NextApiRequest, NextApiResponse } from 'next';
import equal from 'fast-deep-equal';
import to from 'await-to-js';

import { isOrgJSON, Org, OrgJSON } from 'lib/model';
import { auth, db, DecodedIdToken } from 'lib/api/helpers/firebase';
import error from 'lib/api/helpers/error';

export type UpdateOrgRes = OrgJSON;

export default async function updateOrgEndpoint(
  req: NextApiRequest,
  res: NextApiResponse<UpdateOrgRes>
): Promise<void> {
  if (!isOrgJSON(req.body)) {
    error(res, 'You must provide valid OrgJSON in your request body.');
  } else if (typeof req.body.id !== 'string') {
    error(res, 'Your request body must contain a valid org ID.');
  } else if (typeof req.headers.authorization !== 'string') {
    error(res, 'You must provide a valid JWT authorization header.', 401);
  } else {
    const [err, token] = await to<DecodedIdToken>(
      auth.verifyIdToken(req.headers.authorization.replace('Bearer ', ''), true)
    );
    if (err) {
      error(res, `Your JWT is invalid: ${err.message}`, 401, err);
    } else {
      const doc = await db.collection('orgs').doc(req.body.id).get();
      if (!doc.exists) {
        error(res, `Organization (${doc.id}) does not exist.`);
      } else {
        const updated: Org = Org.fromJSON(req.body);
        const original: Org = Org.fromFirestore(doc);
        if (!original.members.includes((token as DecodedIdToken).uid)) {
          error(res, `You are not a member of organization (${doc.id}).`, 401);
        } else if (!equal(updated.members, original.members)) {
          error(res, 'You cannot update organization members.');
        } else {
          await doc.ref.update(updated.toFirestore());
          res.status(200).json(updated.toJSON());
        }
      }
    }
  }
}
