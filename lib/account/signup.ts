import axios, { AxiosError, AxiosResponse } from 'axios';
import { mutate } from 'swr';
import to from 'await-to-js';

import { ApiError, User, UserInterface, UserJSON } from 'lib/model';

export async function signup(user: User, parents: User[] = []): Promise<User> {
  const { default: firebase } = await import('lib/firebase');
  await import('firebase/auth');

  const auth = firebase.auth();
  const json = { user: user.toJSON(), parents: parents.map((p) => p.toJSON()) };
  const [err, res] = await to<AxiosResponse<UserJSON>, AxiosError<ApiError>>(
    axios.post('/api/users', json)
  );

  if (err && err.response) throw new Error(err.response.data.msg);
  if (err && err.request) throw new Error('Users API did not respond.');
  if (err) throw new Error(`Error calling user API: ${err.message}`);

  const { data } = res as AxiosResponse<UserJSON>;
  await auth.signInWithCustomToken(data.token as string);
  await mutate('/api/account', data, false);

  return User.fromJSON(data);
}

export async function signupWithGoogle(
  user?: User,
  parents?: User[]
): Promise<User> {
  const { default: firebase } = await import('lib/firebase');
  await import('firebase/auth');

  const auth = firebase.auth();
  const provider = new firebase.auth.GoogleAuthProvider();
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

  const [err, res] = await to<User>(signup(signedInUser, parents));

  if (err && err.message.includes('already exists')) return signedInUser;
  if (err) throw new Error(err.message);
  return res || signedInUser;
}
