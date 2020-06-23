import { NextApiRequest, NextApiResponse } from 'next';
import { UserJSON, User } from '@tutorbook/model';

import to from 'await-to-js';
import verify from './helpers/verify';
import error from './helpers/error';
import createUser from './helpers/create-user';

import { db, DocumentSnapshot, DocumentReference } from './helpers/firebase';

export type CreateParentRes = UserJSON;

/**
 * Creates a new parent profile and adds it to the user's `parents` field.
 *
 * If the parent profile already exists, this merely ensures that it is included
 * in the user's `parents` field.
 *
 * @param {UserJSON} parent - The parent to create (must have an email field).
 * @return {UserJSON} The final created parent object (typically, exactly the
 * same as the given `parent` parameter... unless the front-end forgot to apply
 * validations that our back-end did).
 */
export default async function createParent(
  req: NextApiRequest,
  res: NextApiResponse<CreateParentRes>
): Promise<void> {
  /* eslint-disable @typescript-eslint/no-unsafe-member-access */
  if (!req.body) {
    error(res, 'You must provide a request body.');
  } else if (typeof req.query.id !== 'string') {
    error(res, 'Your request URL query must contain a valid ID.');
  } else if (typeof req.body.email !== 'string') {
    error(res, 'Your request body must have a valid email field.');
  } else {
    const ref: DocumentReference = db.collection('users').doc(req.query.id);
    const doc: DocumentSnapshot = await ref.get();
    const user: User = User.fromFirestore(doc);
    if (!doc.exists) {
      const msg: string =
        `Firestore profile document (${req.query.id}) does not exist. You ` +
        `can create it by POST-ing to the '/api/users' REST API endpoint.`;
      error(res, msg, 400);
    } else {
      await verify(req, res, user, async () => {
        const parent: User = User.fromJSON(req.body);
        const [err] = await to(createUser(parent));
        if (parent.id) {
          user.parents.push(parent.id);
          await ref.update(user.toFirestore());
          res.status(201).json(parent.toJSON());
        } else if (err) {
          const msg: string =
            `${err.name} creating parent (${parent.toString()}): ` +
            `${err.message}`;
          error(res, msg, 500);
        } else {
          error(res, `Parent (${parent.toString()})'s ID was not found.`, 500);
        }
      });
    }
  }
  /* eslint-enable @typescript-eslint/no-unsafe-member-access */
}
