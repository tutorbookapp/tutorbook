import axios, { AxiosError, AxiosResponse } from 'axios';
import { dequal } from 'dequal/lite';
import { mutate } from 'swr';
import to from 'await-to-js';

import { User, UserInterface, UserJSON } from 'lib/model/user';
import { APIErrorJSON } from 'lib/api/error';

export async function login(user: User): Promise<User> {
  const { default: firebase } = await import('lib/firebase');
  await import('firebase/auth');

  const auth = firebase.auth();
  const [err, res] = await to<
    AxiosResponse<UserJSON>,
    AxiosError<APIErrorJSON>
  >(axios.post('/api/users', user.toJSON()));

  if (err && err.response) throw new Error(err.response.data.message);
  if (err && err.request) throw new Error('Users API did not respond.');
  if (err) throw new Error(`Error calling user API: ${err.message}`);

  const { data } = res as AxiosResponse<UserJSON>;
  await auth.signInWithCustomToken(data.token as string);
  await mutate('/api/account', data, false);

  return User.fromJSON(data);
}

/**
 * @todo Right now, we can only specify a single domain for GSuite users using
 * Google's OpenID `hd` parameter. That is not enough (e.g. PAUSD uses
 * `pausd.org` for teachers and `pausd.us` for students), so we merely fallback
 * to only showing GSuite accounts (guessing that most students and teachers
 * only have one).
 * @see {@link https://developers.google.com/identity/protocols/oauth2/openid-connect#authenticationuriparameters}
 * @see {@link https://firebase.google.com/docs/reference/js/firebase.auth.GoogleAuthProvider#setcustomparameters}
 */
export async function loginWithGoogle(
  user?: User,
  gsuite?: boolean
): Promise<User> {
  const { default: firebase } = await import('lib/firebase');
  await import('firebase/auth');

  const auth = firebase.auth();
  const provider = new firebase.auth.GoogleAuthProvider();
  if (gsuite) provider.setCustomParameters({ hd: '*' });
  const cred = await auth.signInWithPopup(provider);

  if (!cred.user) throw new Error('Did not receive user information.');

  const firebaseUser: Partial<UserInterface> = {
    id: cred.user.uid,
    name: cred.user.displayName as string,
    photo: cred.user.photoURL as string,
    email: cred.user.email as string,
    phone: cred.user.phoneNumber as string,
  };
  const signedInUser = new User({ ...user, ...firebaseUser });

  await mutate('/api/account', signedInUser.toJSON(), false);

  // Create the Firestore profile document (we cannot call the `POST /api/users`
  // endpoint because the Firebase Authentication account already exists).
  const [err, res] = await to<
    AxiosResponse<UserJSON>,
    AxiosError<APIErrorJSON>
  >(axios.put('/api/account', signedInUser.toJSON()));

  if (err && err.response) throw new Error(err.response.data.message);
  if (err && err.request) throw new Error('Users API did not respond.');
  if (err) throw new Error(`Error calling user API: ${err.message}`);

  const { data } = res as AxiosResponse<UserJSON>;
  if (!dequal(data, signedInUser.toJSON())) {
    await mutate('/api/account', data, false);
  }

  return User.fromJSON(data);
}
