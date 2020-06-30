import { NextApiRequest, NextApiResponse } from 'next';
import { User, UserJSON } from 'lib/model';

import error from './helpers/error';
import verify from './helpers/verify';

import { db, DocumentSnapshot } from './helpers/firebase';

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
  } else {
    const doc: DocumentSnapshot = await db
      .collection('users')
      .doc(req.query.id)
      .get();
    const user: User = User.fromFirestore(doc);
    if (!doc.exists) {
      const msg: string =
        `Firestore profile document (${req.query.id}) does not exist. You ` +
        `can create it by POST-ing to the '/api/users' REST API endpoint.`;
      error(res, msg, 400);
    } else {
      await verify(req, res, user, () => res.status(200).json(user.toJSON()));
    }
  }
}
