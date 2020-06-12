import React from 'react';
import {
  ApiError,
  Account,
  User,
  UserJSON,
  Org,
  OrgJSON,
  UserInterface,
} from '@tutorbook/model';
import axios, { AxiosError, AxiosResponse } from 'axios';
import to from 'await-to-js';

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
type Unsubscribe = firebase.Unsubscribe;

interface AccountProviderProps {
  children: JSX.Element[] | JSX.Element;
}

interface AccountProviderState {
  account: Account;
  user: User;
  orgs: Org[];
}

export interface AccountContextValue {
  account: Account;
  accounts: Account[];
  switchAccount: (id: string) => void;
  update: (account: Account) => void;
  token: () => Promise<string> | undefined;
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
    /* eslint-disable @typescript-eslint/no-unused-vars */
    account: new Account(),
    accounts: [] as Account[],
    switchAccount: (id: string) => {},
    update: (account: Account) => {},
    token: (() => undefined) as () => Promise<string> | undefined,
    signup: async (user: User, parents?: User[]) => {},
    signupWithGoogle: async (user?: User, parents?: User[]) => {},
    signout: () => {},
    /* eslint-enable @typescript-eslint/no-unused-vars */
  }
);

export function useAccount(): AccountContextValue {
  return React.useContext(AccountContext);
}

/**
 * Class that manages authentication state and provides a `AccountContext`
 * provider so all child components can access the current user's data. See the
 * `AccountContext` doc comment for more info.
 */
export class AccountProvider extends React.Component<
  AccountProviderProps,
  AccountProviderState
> {
  static readonly auth: Auth = firebase.auth();

  private authUnsubscriber?: Unsubscribe;

  public constructor(props: AccountProviderProps) {
    super(props);
    this.state = { account: new User(), user: new User(), orgs: [] };
    this.signup = this.signup.bind(this);
    this.signupWithGoogle = this.signupWithGoogle.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.switchAccount = this.switchAccount.bind(this);
  }

  private static getToken(): Promise<string> | undefined {
    return AccountProvider.auth.currentUser
      ? AccountProvider.auth.currentUser.getIdToken()
      : undefined;
  }

  public componentDidMount(): void {
    this.authUnsubscriber = AccountProvider.auth.onAuthStateChanged(
      this.handleChange
    );
  }

  public componentWillUnmount(): void {
    if (this.authUnsubscriber) this.authUnsubscriber();
  }

  /**
   * Updates the current user and the selected account **if** the current user's
   * uID matches the account.
   */
  private updateUser(user: User): void {
    this.setState(({ account }) => ({
      user,
      account:
        !account.id || !user.id || user.id === account.id ? user : account,
    }));
  }

  private async handleChange(user: FirebaseUser | null): Promise<void> {
    if (user) {
      const withUserRecord: User = new User({
        /* eslint-disable-next-line react/destructuring-assignment */
        name: user.displayName || '',
        email: user.email || '',
        phone: user.phoneNumber || '',
        photo: user.photoURL || '',
        id: user.uid,
      });
      this.updateUser(withUserRecord);
      const withToken: User = new User({
        ...withUserRecord,
        token: await user.getIdToken(),
      });
      this.updateUser(withToken);
      const [err, res] = await to<
        AxiosResponse<{ user: UserJSON; orgs: OrgJSON[] }>,
        AxiosError<ApiError>
      >(
        axios({
          method: 'get',
          url: '/api/account',
          params: { token: withToken.token },
        })
      );
      if (err && err.response) {
        console.error(`[ERROR] ${err.response.data.msg}`, err.response.data);
        firebase.analytics().logEvent('exception', {
          description: `Account API responded with error: ${err.response.data.msg}`,
          fatal: false,
        });
      } else if (err && err.request) {
        console.error('[ERROR] Account API did not respond:', err.request);
        firebase.analytics().logEvent('exception', {
          description: 'Account API did not respond.',
          fatal: false,
        });
      } else if (err) {
        console.error('[ERROR] Calling account API:', err);
        firebase.analytics().logEvent('exception', {
          description: `Error calling account API: ${err.message}`,
          fatal: false,
        });
      } else {
        const { data } = res as AxiosResponse<{
          user: UserJSON;
          orgs: OrgJSON[];
        }>;
        this.updateUser(User.fromJSON(data.user));
        this.setState({ orgs: data.orgs.map((org) => Org.fromJSON(org)) });
      }
    } else {
      this.updateUser(new User());
    }
  }

  private async signupWithGoogle(
    user: User = new User(),
    parents?: User[]
  ): Promise<void> {
    const provider: AuthProvider = new firebase.auth.GoogleAuthProvider();
    const [err, cred] = await to<UserCredential, AuthError>(
      AccountProvider.auth.signInWithPopup(provider)
    );
    if (err) {
      firebase.analytics().logEvent('exception', {
        description: `Error while signing up with Google. ${err.message}`,
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
      return this.signup(new User({ ...user, ...firebaseUser }), parents);
    } else {
      firebase.analytics().logEvent('exception', {
        description: 'No user in sign-in with Google response.',
        fatal: false,
      });
      throw new Error('No user in sign-in with Google response.');
    }
  }

  private async signup(user: User, parents?: User[]): Promise<void> {
    const [err, res] = await to<
      AxiosResponse<{ user: UserJSON }>,
      AxiosError<ApiError>
    >(
      axios({
        method: 'post',
        url: '/api/user',
        data: {
          user: user.toJSON(),
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
        user: user.toJSON(),
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
        user: user.toJSON(),
        fatal: true,
      });
      throw new Error('User creation API did not respond.');
    } else if (err) {
      // Something happened in setting up the request that triggered
      // an err
      console.error('[ERROR] Calling user API:', err);
      firebase.analytics().logEvent('exception', {
        description: `Error calling user API: ${err.message}`,
        user: user.toJSON(),
        fatal: true,
      });
      throw new Error(`Error calling user API: ${err.message}`);
    } else {
      const { data } = res as AxiosResponse<{ user: UserJSON }>;
      this.setState({ user: User.fromJSON(data.user) });
      await AccountProvider.auth.signInWithCustomToken(
        data.user.token as string
      );
      firebase.analytics().logEvent('login', { method: 'custom_token' });
    }
  }

  /**
   * Switches the current account to one of the already signed-in accounts.
   * @todo In the future, we'll want to be able to pass any account that belongs
   * to one of the `this.state.orgs` (to enable "view as" functionality).
   * @todo Just use one `setState` with a callback function (that contains all
   * the logic in this method).
   */
  private switchAccount(id: string): void {
    console.log(`[DEBUG] Switching to account (${id})...`);
    const { account, user, orgs } = this.state;
    if (id === account.id) return;
    if (id === user.id) {
      console.log('[DEBUG] Account was current signed-in user.');
      this.setState({ account: user });
      return;
    }
    const index: number = orgs.findIndex((org: Org) => id === org.id);
    if (index >= 0) {
      console.log('[DEBUG] Account was current signed-in orgs.');
      this.setState({ account: orgs[index] });
      return;
    }
    throw new Error(`User is not signed into account (${id}).`);
  }

  public render(): JSX.Element {
    const { account, user, orgs } = this.state;
    const { children } = this.props;
    return (
      <AccountContext.Provider
        value={{
          account,
          accounts: [user, ...orgs],
          switchAccount: this.switchAccount,
          update: (newAccount: Account) =>
            this.setState({ account: newAccount }),
          token: AccountProvider.getToken,
          signup: this.signup,
          signupWithGoogle: this.signupWithGoogle,
          signout: AccountProvider.auth.signOut.bind(AccountProvider.auth),
        }}
      >
        {children}
      </AccountContext.Provider>
    );
  }
}
