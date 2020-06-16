import { NextApiRequest, NextApiResponse } from 'next';
import { ApiError, User, UserJSON, Org, OrgJSON } from '@tutorbook/model';

import to from 'await-to-js';
import { db, auth, DecodedIdToken, DocumentSnapshot } from '@tutorbook/admin';

/**
 * Takes a `firebase.auth.currentUser`'s JWT (i.e. the `idToken`) and responds
 * with that user's data and the data of any orgs that user belongs to.
 * @param {string} token - The `idToken` JWT of the signed-in user passed as a
 * query param via the HTTP GET method.
 * @return { user: User, orgs: Org[] } The user's data and the data of any orgs
 * that user belongs to.
 */
export default async function account(
  req: NextApiRequest,
  res: NextApiResponse<ApiError | { user: UserJSON; orgs: OrgJSON[] }>
): Promise<void> {
  function error(msg: string, code = 400, err?: Error): void {
    console.error(`[ERROR] Sending client ${code} with msg (${msg})...`, err);
    res.status(code).json({ msg, ...(err || {}) });
  }
  if (!req.query.token || typeof req.query.token !== 'string') {
    error('You must provide a valid Firebase Auth JWT.', 401);
  } else {
    const [err, token] = await to<DecodedIdToken>(
      auth.verifyIdToken(req.query.token, true)
    );
    if (err) {
      error(`Your Firebase Auth JWT is invalid: ${err.message}`, 401, err);
    } else {
      const { uid } = token as DecodedIdToken;
      if (req.query.id && typeof req.query.id === 'string') {
        // Organizational user is requesting the account data of a member of
        // their organization.
        const authOrgs: Org[] = (
          await db
            .collection('orgs')
            .where('members', 'array-contains', uid)
            .get()
        ).docs.map((org: DocumentSnapshot) => Org.fromFirestore(org));
        const doc: DocumentSnapshot = await db
          .collection('users')
          .doc(req.query.id)
          .get();
        const user: UserJSON = User.fromFirestore(doc).toJSON();
        if (!doc.exists) {
          const msg: string =
            `Firestore profile document (${req.query.id}) did not exist. You ` +
            `can create it by calling the '/api/user' REST API endpoint.`;
          error(msg, 500);
        } else if (authOrgs.every((org) => user.orgs.indexOf(org.id) < 0)) {
          error(`User (${req.query.id}) was not a member of your orgs.`, 401);
        } else {
          const orgs: OrgJSON[] = (
            await db
              .collection('orgs')
              .where('members', 'array-contains', req.query.id)
              .get()
          ).docs.map((org: DocumentSnapshot) =>
            Org.fromFirestore(org).toJSON()
          );
          res.status(200).json({ orgs, user });
        }
      } else {
        // User is merely requesting their own account data.
        const doc: DocumentSnapshot = await db
          .collection('users')
          .doc(uid)
          .get();
        if (!doc.exists) {
          const msg: string =
            `Firestore profile document (${uid}) did not exist. You can create ` +
            `it by calling the '/api/user' REST API endpoint.`;
          error(msg, 500);
        } else {
          const user: UserJSON = User.fromFirestore(doc).toJSON();
          const orgs: OrgJSON[] = (
            await db
              .collection('orgs')
              .where('members', 'array-contains', uid)
              .get()
          ).docs.map((org: DocumentSnapshot) =>
            Org.fromFirestore(org).toJSON()
          );
          user.token = req.query.token;
          res.status(200).json({ orgs, user });
        }
      }
    }
  }
}
