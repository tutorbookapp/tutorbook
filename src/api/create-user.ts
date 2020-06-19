import { NextApiRequest, NextApiResponse } from 'next';
import { User, UserJSON } from '@tutorbook/model';
import { SignUpEmail } from '@tutorbook/emails';

import to from 'await-to-js';
import mail from '@sendgrid/mail';
import error from './error';

import {
  db,
  auth,
  UserRecord,
  FirebaseError,
  DocumentReference,
} from './firebase';

mail.setApiKey(process.env.SENDGRID_API_KEY as string);

/**
 * Creates a new user and handles various errors:
 * - The `auth/email-already-exists` error by updating the existing error (see
 *   the above helper function for how that's implemented).
 * - The `auth/phone-number-already-exists` error by creating the user w/out the
 *   given phone number (this is a bit hacky and we might want to re-think it
 *   later on).
 *
 * While this function doesn't actually return anything, it does perform side
 * effects on the given `user` object (i.e. adding the uID).
 */
async function createUser(user: User, parents?: User[]): Promise<void> {
  /* eslint-disable no-param-reassign, no-shadow */
  console.log(`[DEBUG] Creating user ${user.toString()}...`);
  const [err, userRecord] = await to<UserRecord, FirebaseError>(
    auth.createUser({
      disabled: false,
      displayName: user.name,
      photoURL: user.photo ? user.photo : undefined,
      email: user.email,
      emailVerified: false,
      phoneNumber: user.phone ? user.phone : undefined,
    })
  );
  if (err && err.code === 'auth/email-already-exists') {
    console.log('[DEBUG] Handling email address already exists error...');
    throw new Error(
      `User (${user.email}) already exists. Please call the '/api/user/update' endpoint instead.`
    );
  } else if (err && err.code === 'auth/phone-number-already-exists') {
    console.log('[DEBUG] Handling phone number already exists error...');
    const [err, userRecord] = await to<UserRecord, FirebaseError>(
      auth.createUser({
        disabled: false,
        displayName: user.name,
        photoURL: user.photo ? user.photo : undefined,
        email: user.email,
        emailVerified: false,
      })
    );
    if (err)
      throw new Error(
        `${err.name} creating ${user.toString()}: ${err.message}`
      );
    user.id = (userRecord as UserRecord).uid;
    console.log(`[DEBUG] Created ${user.name}'s account (${user.id}).`);
  } else if (err) {
    throw new Error(`${err.name} creating ${user.toString()}: ${err.message}`);
  } else {
    user.id = (userRecord as UserRecord).uid;
    console.log(`[DEBUG] Created ${user.name}'s account (${user.id}).`);
  }
  const userRef: DocumentReference = db.collection('users').doc(user.id);
  if (parents) {
    await Promise.all(
      parents.map(async (parent: User) => {
        console.log(`[DEBUG] Creating parent ${parent.toString()}...`);
        await createUser(parent);
        user.parents.push(parent.id);
        console.log(`[DEBUG] Created parent ${parent.toString()}.`);
      })
    );
  }
  console.log('[DEBUG] Setting profile...');
  await userRef.set(user.toFirestore());
  console.log(`[DEBUG] Set ${user.name}'s profile (${user.id}).`);
  /* eslint-enable no-param-reassign, no-shadow */
}

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
        error(
          res,
          `${err.name} creating login token: ${err.message}`,
          500,
          err
        );
      } else {
        user.token = token;
        res.status(201).json(user.toJSON());
        await mail.send(new SignUpEmail(user));
      }
    }
  }
  /* eslint-enable @typescript-eslint/no-unsafe-member-access, no-shadow */
}
