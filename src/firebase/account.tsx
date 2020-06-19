import React from 'react';
import { ApiError, User, UserJSON, UserInterface } from '@tutorbook/model';

import axios, { AxiosError, AxiosResponse } from 'axios';
import to from 'await-to-js';
import useSWR, { mutate, SWRConfig } from 'swr';

import firebase from './base';

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

interface AccountProviderProps {
  children: JSX.Element[] | JSX.Element;
}

export interface AccountContextValue {
  user: User;
  updateUser: (user: User) => void;
  getToken: () => Promise<string>;
  signup: (user: User, parents?: User[]) => Promise<void>;
  signupWithGoogle: (user?: User, parents?: User[]) => Promise<void>;
  signout: () => void;
}

/**
 * The `Account` object is the base for both the `User` and the `Org` objects.
 * Because of this, we can have one `AccountProvider` for both organizations and
 * users.
 *
 * Behind the scenes, the `AccountProvider` depends on the
 * `firebase.auth.currentUser` to fetch account data from the `api/account` API
 * endpoint **but** it exposes only the `User` or `Org` data to it's consumers.
 *
 * The `api/account` REST API endpoint returns **both** user account data (i.e.
 * the signed-in `User` object) _and_ the account data of any organizations that
 * the user belongs to.
 *
 * We store the last used account as a session cookie (i.e. so that the
 * signed-in user doesn't have to switch to an org account for every session).
 *
 * The value of the `AccountProvider` is controlled by the profile drop-down
 * menu (included in our `Header` component). That drop-down menu enables the
 * signed-in user to switch between their personal account and any org accounts
 * to which they have access.
 *
 * Our UI/UX changes based on the value of the `AccountProvider` (i.e. most of
 * our UI/UX is a consumer of the `AccountContext`).
 */
export const AccountContext: React.Context<AccountContextValue> = React.createContext(
  {
    /* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/require-await */
    user: new User(),
    updateUser: (user: User) => {},
    getToken: async () => '',
    signup: async (user: User, parents?: User[]) => {},
    signupWithGoogle: async (user?: User, parents?: User[]) => {},
    signout: () => {},
    /* eslint-enable @typescript-eslint/no-unused-vars, @typescript-eslint/require-await */
  }
);

export function useAccount(): AccountContextValue {
  return React.useContext(AccountContext);
}

// Fetch the latest `user` data from the `/api/account` endpoint.
async function fetchAccountData(url: string): Promise<User> {
  console.log(`[DEBUG] Fetching account data...`);
  if (!auth.currentUser) throw new Error(`No signed-in user.`);
  const token: string = await auth.currentUser.getIdToken();
  const [err, res] = await to<AxiosResponse<UserJSON>, AxiosError<ApiError>>(
    axios({
      url,
      method: 'get',
      headers: { Authorization: `Bearer ${token}` },
    })
  );
  if (err && err.response) {
    console.error(`[ERROR] ${err.response.data.msg}`, err.response.data);
    firebase.analytics().logEvent('exception', {
      description: `Account API responded with error: ${err.response.data.msg}`,
      fatal: false,
    });
    throw new Error(err.response.data.msg);
  } else if (err && err.request) {
    console.error('[ERROR] Account API did not respond:', err.request);
    firebase.analytics().logEvent('exception', {
      description: 'Account API did not respond.',
      fatal: false,
    });
    throw new Error('Account API did not respond.');
  } else if (err) {
    console.error('[ERROR] Calling account API:', err);
    firebase.analytics().logEvent('exception', {
      description: `Error calling account API: ${err.message}`,
      fatal: false,
    });
    throw new Error(`Error while calling account API: ${err.message}`);
  } else {
    return User.fromJSON((res as AxiosResponse<UserJSON>).data);
  }
}

export function AccountProvider({
  children,
}: AccountProviderProps): JSX.Element {
  const { data: user } = useSWR<User>('/api/account', fetchAccountData);

  // Add a listener that updates our `user` state variable whenever the Firebase
  // auth state changes.
  // TODO: Is this even necessary when we explicitly add the `auth.currentUser`
  // as a dependency on `useSWR`?
  React.useEffect(
    () =>
      auth.onAuthStateChanged((firebaseUser: FirebaseUser | null) => {
        console.log('[DEBUG] Firebase auth state changed:', firebaseUser);
        if (firebaseUser)
          return mutate('/api/account', async (prev?: User) => {
            console.log('[DEBUG] Firebase user signed-in, updating user...');
            return new User({
              ...(prev && firebaseUser.uid === prev.id ? prev : {}),
              name: firebaseUser.displayName || '',
              email: firebaseUser.email || '',
              phone: firebaseUser.phoneNumber || '',
              photo: firebaseUser.photoURL || '',
              id: firebaseUser.uid,
              token: await firebaseUser.getIdToken(),
            });
          });
        console.log('[DEBUG] Firebase user signed-out, updating user...');
        return mutate('/api/users/', new User());
      }),
    []
  );

  function fetcher<T>(url: string): Promise<T> {
    return axios({
      url,
      method: 'get',
      headers: { authorization: `Bearer ${token}` },
    }).then((res: AxiosResponse<T>) => res.data);
  }

  return (
    <SWRConfig value={{ fetcher }}>
      <AccountContext.Provider
        value={{
          signup,
          signupWithGoogle,
          user: user || new User(),
          getToken: async () => {
            if (user && user.token) return user.token;
            if (auth.currentUser) return auth.currentUser.getIdToken();
            throw new Error('No signed-in user.');
          },
          updateUser: (newUser: User) => mutate('/api/account', newUser),
          signout: auth.signOut.bind(auth),
        }}
      >
        {children}
      </AccountContext.Provider>
    </SWRConfig>
  );
}
