import axios, { AxiosError, AxiosResponse } from 'axios';
import { mutate } from 'swr';
import to from 'await-to-js';

import { User } from 'lib/model/user';
import { APIErrorJSON } from 'lib/api/error';

// TODO: This is very insecure; it allows anyone to create an account for and be
// authenticated as anyone that they have contact info for.
export async function login(user: User): Promise<User> {
  const { default: firebase } = await import('lib/firebase');
  await import('firebase/auth');

  const auth = firebase.auth();
  const [err, res] = await to<
    AxiosResponse<User>,
    AxiosError<APIErrorJSON>
  >(axios.post('/api/users', user));

  if (err && err.response) throw new Error(err.response.data.message);
  if (err && err.request) throw new Error('Users API did not respond.');
  if (err) throw new Error(`Error calling user API: ${err.message}`);

  const { data } = res as AxiosResponse<User>;
  await auth.signInWithCustomToken(data.token as string);
  await mutate('/api/account', data, false);

  return User.parse(data);
}

export async function loginWithGoogle(
  user?: User,
  gsuite?: boolean
): Promise<User> {
  const { default: firebase } = await import('lib/firebase');
  await import('firebase/auth');
  const auth = firebase.auth();
  
  // As httpOnly cookies are to be used, do not persist any state client side.
  // @see {@link https://firebase.google.com/docs/auth/admin/manage-cookies}
  await auth.setPersistence(firebase.auth.Auth.Persistence.NONE);

  // TODO: Sign-in with redirect instead (less likely to be blocked).
  const provider = new firebase.auth.GoogleAuthProvider();
  if (gsuite) provider.setCustomParameters({ hd: '*' });
  const cred = await auth.signInWithPopup(provider);

  if (!cred.user) throw new Error('Did not receive user information.');

  const firebaseUser: Partial<User> = {
    id: cred.user.uid,
    name: cred.user.displayName as string,
    photo: cred.user.photoURL as string,
    email: cred.user.email as string,
    phone: cred.user.phoneNumber as string,
  };
  const signedInUser = User.parse({ ...user, ...firebaseUser });

  // Create the Firestore profile document (we cannot call the `POST /api/users`
  // endpoint because the Firebase Authentication account already exists). This
  // also sets the authentication cookie because we passed it the ID token.
  const token = await cred.user.getIdToken();
  const [err, res] = await to<
    AxiosResponse<User>,
    AxiosError<APIErrorJSON>
  >(axios.put('/api/account', { ...signedInUser, token }));

  if (err && err.response) throw new Error(err.response.data.message);
  if (err && err.request) throw new Error('Users API did not respond.');
  if (err) throw new Error(`Error calling user API: ${err.message}`);

  const { data } = res as AxiosResponse<User>;
  await mutate('/api/account', data, false);

  return User.parse(data);
}
