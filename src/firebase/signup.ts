import firebase from './base';
import 'firebase/auth';

import axios, { AxiosError, AxiosResponse } from 'axios';
import to from 'await-to-js';

/**
 * Type aliases so that we don't have to type out the whole type. We could try
 * importing these directly from the `@firebase/firestore-types` or the
 * `@google-cloud/firestore` packages, but that's not recommended.
 * @todo Perhaps figure out a way to **only** import the type defs we need.
 */
type Auth = firebase.auth.Auth;
type FirebaseUser = firebase.User;
type AuthError = firebase.auth.AuthError;
type AuthProvider = firebase.auth.AuthProvider;
type UserCredential = firebase.auth.UserCredential;

const auth: Auth = firebase.auth();

async function signup(newUser: User, parents?: User[]): Promise<void> {
  const [err, res] = await to<AxiosResponse<UserJSON>, AxiosError<ApiError>>(
    axios({
      method: 'post',
      url: '/api/users',
      data: {
        user: newUser.toJSON(),
        parents: (parents || []).map((parent: User) => parent.toJSON()),
      },
    })
  );
  if (err && err.response) {
    // The request was made and the server responded with a status
    // code that falls out of the range of 2xx
    console.error(`[ERROR] ${err.response.data.msg}`, err.response.data);
    firebase.analytics().logEvent('exception', {
      description: `User API responded with error: ${err.response.data.msg}`,
      user: newUser.toJSON(),
      fatal: true,
    });
    throw new Error(err.response.data.msg);
  } else if (err && err.request) {
    // The request was made but no response was received
    // `err.request` is an instance of XMLHttpRequest in the
    // browser and an instance of http.ClientRequest in node.js
    console.error('[ERROR] User API did not respond:', err.request);
    firebase.analytics().logEvent('exception', {
      description: 'User API did not respond.',
      user: newUser.toJSON(),
      fatal: true,
    });
    throw new Error('User creation API did not respond.');
  } else if (err) {
    // Something happened in setting up the request that triggered
    // an err
    console.error('[ERROR] Calling user API:', err);
    firebase.analytics().logEvent('exception', {
      description: `Error calling user API: ${err.message}`,
      user: newUser.toJSON(),
      fatal: true,
    });
    throw new Error(`Error calling user API: ${err.message}`);
  } else {
    const signedInUser: User = User.fromJSON(
      (res as AxiosResponse<UserJSON>).data
    );
    await auth.signInWithCustomToken(signedInUser.token as string);
    firebase.analytics().logEvent('login', { method: 'custom_token' });
  }
}

async function signupWithGoogle(
  newUser?: User,
  parents?: User[]
): Promise<void> {
  const provider: AuthProvider = new firebase.auth.GoogleAuthProvider();
  const [err, cred] = await to<UserCredential, AuthError>(
    auth.signInWithPopup(provider)
  );
  if (err) {
    firebase.analytics().logEvent('exception', {
      description: `Error while signing up with Google. ${err.message}`,
      user: (newUser || new User()).toJSON(),
      fatal: false,
    });
    throw new Error(err.message);
  } else if (cred && cred.user) {
    const firebaseUser: Partial<UserInterface> = {
      name: cred.user.displayName as string,
      photo: cred.user.photoURL as string,
      email: cred.user.email as string,
      phone: cred.user.phoneNumber as string,
    };
    const signedInUser = new User({ ...newUser, ...firebaseUser });
    return signup(signedInUser, parents);
  } else {
    firebase.analytics().logEvent('exception', {
      description: 'No user in sign-in with Google response.',
      fatal: false,
    });
    throw new Error('No user in sign-in with Google response.');
  }
}
