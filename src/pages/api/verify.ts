import { NextApiRequest, NextApiResponse } from 'next';
import { ApiError, Org, Verification } from '@tutorbook/model';

import to from 'await-to-js';
import {
  db,
  auth,
  DecodedIdToken,
  DocumentReference,
  DocumentSnapshot,
} from '@tutorbook/admin';

/**
 * Updates the verifications on an existing user's profile (that is within one
 * of the request sender's organizations).
 * @param {string} token - The user's Firebase Auth JWT.
 * @param {string} id - The uID of the user to update the verifications on.
 * @param {Verification[]} verifications - An array of updated verifications.
 * @return {Verification[]} The sanitized array of verifications that are now
 * in the user's profile document.
 */
export default async function verify(
  req: NextApiRequest,
  res: NextApiResponse<ApiError | Verification[]>
): Promise<void> {
  /* eslint-disable @typescript-eslint/no-unsafe-member-access */
  function error(msg: string, code = 400, err?: Error): void {
    console.error(`[ERROR] Sending client ${code} with msg (${msg})...`, err);
    res.status(code).send({ msg, ...(err || {}) });
  }
  if (!req.body) {
    error('You must provide a request body.');
  } else if (!req.body.id || typeof req.body.id !== 'string') {
    error('You must provide a valid user ID to create the verifications for.');
  } else if (
    !req.body.verifications ||
    !(req.body.verifications instanceof Array)
  ) {
    error('You must provide valid verifications in your request body.');
  } else if (!req.body.token || typeof req.body.token !== 'string') {
    error('You must provide a valid Firebase Auth JWT.');
  } else {
    const [err, token] = await to<DecodedIdToken>(
      auth.verifyIdToken(req.body.token, true)
    );
    if (err) {
      error(`Your Firebase Auth JWT is invalid: ${err.message}`, 401, err);
    } else {
      const { uid } = token as DecodedIdToken;
      const orgs: Org[] = (
        await db
          .collection('orgs')
          .where('members', 'array-contains', uid)
          .get()
      ).docs.map((org: DocumentSnapshot) => Org.fromFirestore(org));
      const id = req.body.id as string;
      const ref: DocumentReference = db.collection('users').doc(id);
      const doc: DocumentSnapshot = await ref.get();
      const userOrgs: string[] = ((doc.data() || {}).orgs as string[]) || [];
      if (!doc.exists) {
        error(`Profile (${id}) did not exist.`, 500);
      } else if (orgs.every((org) => userOrgs.indexOf(org.id) < 0)) {
        error(`User (${id}) was not a member of your orgs.`, 401);
      } else {
        const verifications = req.body.verifications as Verification[];
        await ref.update({ verifications });
        res.status(201).json({ verifications });
      }
    }
  }
  /* eslint-enable @typescript-eslint/no-unsafe-member-access */
}
