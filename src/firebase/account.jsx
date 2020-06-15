import React from 'react';
import { isUserJSON, isOrgJSON, Account, User, Org } from '@tutorbook/model';
import isEqual from 'lodash.isequal';
import axios from 'axios';
import to from 'await-to-js';
import useSWR, { mutate } from 'swr';
import firebase from './base';
const auth = firebase.auth();
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
export const AccountContext = React.createContext({
  /* eslint-disable @typescript-eslint/no-unused-vars */
  account: new Account(),
  accounts: [],
  update: (account) => {},
  signup: async (user, parents) => {},
  signupWithGoogle: async (user, parents) => {},
  signout: () => {},
});
export function useAccount() {
  return React.useContext(AccountContext);
}
const initialData = { user: new User(), orgs: [] };
export function AccountProvider({ children }) {
  if (process.browser) window.auth = auth;
  // Fetch the latest `user` and `orgs` data from the `/api/account` endpoint.
  async function fetchData(url) {
    //console.log(`[DEBUG] Fetching account data...`);
    if (!auth.currentUser) throw new Error(`No signed-in user.`);
    const token = await auth.currentUser.getIdToken();
    const [err, res] = await to(axios.get(url, { params: { token } }));
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
      const {
        data: { user, orgs },
      } = res;
      return {
        user: User.fromJSON(user),
        orgs: orgs.map((org) => Org.fromJSON(org)),
      };
    }
  }
  const { data } = useSWR('/api/account', fetchData, {
    initialData,
  });
  //console.log('[DEBUG] Account data:', data);
  const [account, setAccount] = React.useState(() => {
    if (process.browser) {
      const cacheString = localStorage.getItem('account') || '';
      if (!cacheString) return new User();
      try {
        const cacheData = JSON.parse(cacheString);
        if (isUserJSON(cacheData)) return User.fromJSON(cacheData);
        if (isOrgJSON(cacheData)) return Org.fromJSON(cacheData);
      } catch (err) {
        console.warn(`[WARNING] Error parsing cache (${cacheString}):`, err);
      }
    }
    return new User();
  });
  // Add a listener that updates our `user` state variable whenever the Firebase
  // auth state changes.
  React.useEffect(
    () =>
      auth.onAuthStateChanged((firebaseUser) => {
        //console.log('[DEBUG] Firebase auth state changed:', firebaseUser);
        if (firebaseUser)
          return mutate('/api/account', async (prev = initialData) => {
            //console.log('[DEBUG] Firebase user signed-in, updating user...');
            const user = new User(
              Object.assign(
                Object.assign(
                  {},
                  prev && firebaseUser.uid === prev.user.id ? prev.user : {}
                ),
                {
                  name: firebaseUser.displayName || '',
                  email: firebaseUser.email || '',
                  phone: firebaseUser.phoneNumber || '',
                  photo: firebaseUser.photoURL || '',
                  id: firebaseUser.uid,
                  token: await firebaseUser.getIdToken(),
                }
              )
            );
            return Object.assign(Object.assign({}, prev), { user });
          });
        //console.log('[DEBUG] Firebase user signed-out, updating user...');
        return mutate('/api/account', { orgs: [], user: new User() });
      }),
    []
  );
  // When the account is updated:
  // 1. Update `data.user` if the account is a `User`, the account's `id` is the
  //    same as `data.user`'s id, and the account is different than `data.user`.
  // 2. Update one of the `data.orgs` if the given account is an `Org` and there
  //    is an org with the same id and the account is different than that org.
  React.useEffect(() => {
    /* eslint-disable-next-line @typescript-eslint/require-await */
    void mutate('/api/account', async (prev = initialData) => {
      if (
        account instanceof User &&
        account.id === prev.user.id &&
        !isEqual(account, prev.user)
      ) {
        //console.log('[DEBUG] Account was updated, updating user...');
        return Object.assign(Object.assign({}, prev), { user: account });
      }
      const orgs = Array.from(prev.orgs);
      const idx = orgs.findIndex((org) => org.id === account.id);
      if (account instanceof Org && idx >= 0 && !isEqual(account, orgs[idx])) {
        //console.log('[DEBUG] Account was updated, updating orgs...');
        orgs[idx] = account;
        return Object.assign(Object.assign({}, prev), { orgs });
      }
      //console.log(
      //'[DEBUG] Account was updated but it matched our current data, skipping local mutation...'
      //);
      return prev;
    });
  }, [account]);
  // TODO: Perhaps remove this backup as it could cause security issues.
  React.useEffect(() => {
    if (process.browser)
      localStorage.setItem('account', JSON.stringify(account));
  }, [account]);
  // When data is updated:
  // 1. Reset the account if the data is empty.
  // 2. Update the account to match `data.user` if the account doesn't have an
  //    id (yet) but the `data.user` does.
  // 3. Update the account to match `data.user` if the account's id is the
  //    same as `data.user`'s id and the account is different than `data.user`.
  // 4. Update the account to match one of the `data.orgs` if the account's id
  //    is the same as one of the `data.orgs`'s id and the account is different
  //    from that org.
  React.useEffect(() => {
    setAccount((prevAccount) => {
      if (!data) {
        //console.log('[DEBUG] Data was empty, reseting account...');
        return new User();
      }
      if (data.user.id && !prevAccount.id) {
        //console.log('[DEBUG] User just signed-in, updating account...');
        return data.user;
      }
      if (data.user.id === prevAccount.id && !isEqual(prevAccount, data.user)) {
        //console.log('[DEBUG] User was updated, updating account...');
        return data.user;
      }
      const idx = data.orgs.findIndex((org) => org.id === prevAccount.id);
      if (idx >= 0 && !isEqual(prevAccount, data.orgs[idx])) {
        //console.log('[DEBUG] Orgs were updated, updating account...');
        return data.orgs[idx];
      }
      //console.log(
      //'[DEBUG] Data was updated but it matched our current account, skipping state update...'
      //);
      return prevAccount;
    });
  }, [data]);
  async function signup(newUser, parents) {
    const [err, res] = await to(
      axios({
        method: 'post',
        url: '/api/user',
        data: {
          user: newUser.toJSON(),
          parents: (parents || []).map((parent) => parent.toJSON()),
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
      const signedInUser = User.fromJSON(res.data.user);
      await auth.signInWithCustomToken(signedInUser.token);
      firebase.analytics().logEvent('login', { method: 'custom_token' });
    }
  }
  async function signupWithGoogle(newUser, parents) {
    const provider = new firebase.auth.GoogleAuthProvider();
    const [err, cred] = await to(auth.signInWithPopup(provider));
    if (err) {
      firebase.analytics().logEvent('exception', {
        description: `Error while signing up with Google. ${err.message}`,
        user: (newUser || new User()).toJSON(),
        fatal: false,
      });
      throw new Error(err.message);
    } else if (cred && cred.user) {
      const firebaseUser = {
        name: cred.user.displayName,
        photo: cred.user.photoURL,
        email: cred.user.email,
        phone: cred.user.phoneNumber,
      };
      const signedInUser = new User(
        Object.assign(Object.assign({}, newUser), firebaseUser)
      );
      return signup(signedInUser, parents);
    } else {
      firebase.analytics().logEvent('exception', {
        description: 'No user in sign-in with Google response.',
        fatal: false,
      });
      throw new Error('No user in sign-in with Google response.');
    }
  }
  return (
    <AccountContext.Provider
      value={{
        signup,
        signupWithGoogle,
        account,
        accounts: data ? [data.user, ...data.orgs] : [account],
        update: (newAccount) => {
          if (process.browser) localStorage.setItem('account', newAccount.id);
          setAccount(newAccount);
        },
        signout: auth.signOut.bind(auth),
      }}
    >
      {children}
    </AccountContext.Provider>
  );
}
