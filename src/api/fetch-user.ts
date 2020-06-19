import { NextApiRequest, NextApiResponse } from 'next';
import { Org, OrgJSON, User, UserJSON, ApiError } from '@tutorbook/model';

import to from 'await-to-js';
import error from './error';

import { db, auth, DocumentSnapshot, DecodedIdToken } from './firebase';

export type FetchUserRes = ApiError | { user: UserJSON; orgs: OrgJSON[] };

/**
 * Takes a `firebase.auth.currentUser`'s JWT (i.e. the `idToken`) and responds
 * with that user's data and the data of any orgs that user belongs to.
 * @param {string} token - The `idToken` JWT of the signed-in user passed as a
 * query param via the HTTP GET method.
 * @return { user: User, orgs: Org[] } The user's data and the data of any orgs
 * that user belongs to.
 */
export default async function fetchUser(
  req: NextApiRequest,
  res: NextApiResponse<FetchUserRes>
): Promise<void> {
  if (!req.headers.authorization) {
    error(res, 'You must provide a valid Firebase Auth JWT.', 401);
  } else {
    const [err, token] = await to<DecodedIdToken>(
      auth.verifyIdToken(req.headers.authorization.replace('Bearer ', ''), true)
    );
    if (err) {
      error(res, `Your Firebase Auth JWT is invalid: ${err.message}`, 401, err);
    } else {
      const authOrgs: Org[] = (
        await db
          .collection('orgs')
          .where('members', 'array-contains', (token as DecodedIdToken).uid)
          .get()
      ).docs.map((org: DocumentSnapshot) => Org.fromFirestore(org));

      const doc: DocumentSnapshot = await db
        .collection('users')
        .doc(req.query.id)
        .get();
      const user: UserJSON = User.fromFirestore(doc).toJSON();
      const orgs: OrgJSON[] = (
        await db
          .collection('orgs')
          .where('members', 'array-contains', req.query.id)
          .get()
      ).docs.map((org) => Org.fromFirestore(org).toJSON());

      if (!doc.exists) {
        const msg: string =
          `Firestore profile document (${req.query.id}) does not exist. You ` +
          `can create it by POST-ing to the '/api/users' REST API endpoint.`;
        error(res, msg, 500);
      } else if ((token as DecodedIdToken).uid === req.query.id) {
        // User is fetching their own profile data.
        res.status(200).json({ orgs, user });
      } else if (authOrgs.every((org: Org) => user.orgs.indexOf(org.id) < 0)) {
        error(res, `User (${req.query.id}) is not a member of your orgs.`, 401);
      } else {
        // User is fetching profile data for an org they're a member of.
        res.status(200).json({ orgs, user });
      }
    }
  }
}
