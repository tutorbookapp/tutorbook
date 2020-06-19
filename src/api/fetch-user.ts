import { NextApiRequest, NextApiResponse } from 'next';
import { Org, User, UserJSON } from '@tutorbook/model';

import to from 'await-to-js';
import error from './error';

import { db, auth, DocumentSnapshot, DecodedIdToken } from './firebase';

export type FetchUserRes = UserJSON;

/**
 * Takes a `firebase.auth.currentUser`'s JWT (i.e. the `idToken`) and responds
 * with that user's data and the data of any orgs that user belongs to.
 * @param {string} token - The `idToken` JWT of the signed-in user passed as a
 * query param via the HTTP GET method.
 * @return {UserJSON} The user's profile document data.
 */
export default async function fetchUser(
  req: NextApiRequest,
  res: NextApiResponse<FetchUserRes>
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
      const orgs: Org[] = (
        await db
          .collection('orgs')
          .where('members', 'array-contains', (token as DecodedIdToken).uid)
          .get()
      ).docs.map((org: DocumentSnapshot) => Org.fromFirestore(org));

      const doc: DocumentSnapshot = await db
        .collection('users')
        .doc(req.query.id)
        .get();
      const user: User = User.fromFirestore(doc);

      if (!doc.exists) {
        const msg: string =
          `Firestore profile document (${req.query.id}) does not exist. You ` +
          `can create it by POST-ing to the '/api/users' REST API endpoint.`;
        error(res, msg, 500);
      } else if ((token as DecodedIdToken).uid === req.query.id) {
        // User is fetching their own profile data.
        res.status(200).json(user.toJSON());
      } else if (orgs.every((org: Org) => user.orgs.indexOf(org.id) < 0)) {
        error(res, `${user.toString()} is not a member of your orgs.`, 401);
      } else {
        // User is fetching profile data for an org they're a member of.
        res.status(200).json(user.toJSON());
      }
    }
  }
}
