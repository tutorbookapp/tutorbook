import { mutate } from 'swr';
import axios, { AxiosError, AxiosResponse } from 'axios';
import to from 'await-to-js';

import { ApiError, User, UserInterface, UserJSON } from 'lib/model';

export async function signup(newUser: User, parents?: User[]): Promise<void> {
  const { default: firebase } = await import('lib/firebase');
  await import('firebase/auth');
  const auth = firebase.auth();
  const [err, res] = await to<AxiosResponse<UserJSON>, AxiosError<ApiError>>(
    axios.post('/api/users', {
      user: newUser.toJSON(),
      parents: (parents || []).map((parent: User) => parent.toJSON()),
    })
  );
  if (err && err.response) {
    // The request was made and the server responded with a status
    // code that falls out of the range of 2xx
    if (err.response.data.msg.indexOf('already exists') >= 0) {
      console.warn('[WARNING] User already existed.');
    } else {
      throw new Error(err.response.data.msg);
    }
  } else if (err && err.request) {
    // The request was made but no response was received
    // `err.request` is an instance of XMLHttpRequest in the
    // browser and an instance of http.ClientRequest in node.js
    throw new Error('User creation API did not respond.');
  } else if (err) {
    // Something happened in setting up the request that triggered
    // an err
    throw new Error(`Error calling user API: ${err.message}`);
  } else {
    const signedInUser: User = User.fromJSON(
      (res as AxiosResponse<UserJSON>).data
    );
    await auth.signInWithCustomToken(signedInUser.token as string);
    await mutate('/api/account', signedInUser.toJSON());
    firebase.analytics().logEvent('login', { method: 'custom_token' });
  }
}

// TODO: Open a pop-up window to an API endpoint that hosts the Firebase Auth
// SDK and have *it* redirect to the Google sign-in. That way, we don't have to
// include the **entire** Firebase Auth SDK on each page of the app.
export async function signupWithGoogle(
  newUser?: User,
  parents?: User[]
): Promise<void> {
  const { default: firebase } = await import('lib/firebase');
  await import('firebase/auth');

  type AuthError = firebase.auth.AuthError;
  type AuthProvider = firebase.auth.AuthProvider;
  type UserCredential = firebase.auth.UserCredential;

  const auth = firebase.auth();
  const provider: AuthProvider = new firebase.auth.GoogleAuthProvider();
  const [err, cred] = await to<UserCredential, AuthError>(
    auth.signInWithPopup(provider)
  );
  if (err) {
    throw new Error(err.message);
  } else if (cred && cred.user) {
    const firebaseUser: Partial<UserInterface> = {
      id: cred.user.uid,
      name: cred.user.displayName as string,
      photo: cred.user.photoURL as string,
      email: cred.user.email as string,
      phone: cred.user.phoneNumber as string,
    };
    const signedInUser = new User({ ...newUser, ...firebaseUser });
    await mutate('/api/account', signedInUser.toJSON());
    return signup(signedInUser, parents);
  } else {
    throw new Error('No user in sign-in with Google response.');
  }
}
