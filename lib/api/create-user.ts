import { NextApiRequest, NextApiResponse } from 'next';
import { User, UserJSON } from 'lib/model';
import { SignUpEmail } from 'lib/emails';

import to from 'await-to-js';
import mail from '@sendgrid/mail';
import error from './helpers/error';
import createUser from './helpers/create-user';

import { auth, FirebaseError } from './helpers/firebase';

mail.setApiKey(process.env.SENDGRID_API_KEY as string);

export type CreateUserRes = UserJSON;

/**
 * Takes the parsed results of a sign-up form (e.g. the `hero-form`) and:
 * 1. Creates and signs-in a new Firebase Authentication user.
 * 2. (Optional) Creates a new Firesbase Authentication user for the parents.
 * 3. (Optional) Creates a new Firestore profile document for the parents.
 * 4. Creates a new Firestore profile document for the given user.
 * 5. Sends an email verification link to the new user (and his/her parents).
 *
 * Note that this endpoint **will not function** if a user with the given  email
 * already exists. One should use the `/api/user/update` endpoint for that.
 *
 * @param {User} user - The user to create (should be in JSON form).
 * @param {User[]} [parents] - The parents of the given user to create (also in
 * JSON form).
 *
 * @return {UserJSON} The create user profile in JSON form containing a custom
 * Firebase Authentication login token (that can be used to log the user into
 * Firebase client-side; a requirement to retrieve the user's JWT for subsequent
 * API requests).
 */
export default async function createUserEndpoint(
  req: NextApiRequest,
  res: NextApiResponse<CreateUserRes>
): Promise<void> {
  /* eslint-disable @typescript-eslint/no-unsafe-member-access, no-shadow */
  if (!req.body) {
    error(res, 'You must provide a request body.');
  } else if (!req.body.user) {
    error(res, 'Your request body must contain a user field.');
  } else {
    const user: User = User.fromJSON(req.body.user);
    const parents: User[] = (
      (req.body.parents as UserJSON[]) || []
    ).map((parentJSON: UserJSON) => User.fromJSON(parentJSON));
    const [err] = await to(createUser(user, parents));
    if (err) {
      error(res, err.message, 500, err);
    } else {
      const [err, token] = await to<string, FirebaseError>(
        auth.createCustomToken(user.id)
      );
      if (err) {
        error(res, `${err.name} creating auth JWT: ${err.message}`, 500, err);
      } else {
        user.token = token;
        res.status(201).json(user.toJSON());
        await mail.send(new SignUpEmail(user));
      }
    }
  }
  /* eslint-enable @typescript-eslint/no-unsafe-member-access, no-shadow */
}
