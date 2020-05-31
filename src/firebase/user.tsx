import React from 'react';
import {
  ApiError,
  User,
  UserJSONInterface,
  UserInterface,
} from '@tutorbook/model';
import { AxiosError, AxiosResponse } from 'axios';
import { DBContext } from './db';

import axios from 'axios';
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
type DocumentSnapshot = firebase.firestore.DocumentSnapshot;
type DocumentReference = firebase.firestore.DocumentReference;

interface UserProviderProps {
  children: JSX.Element[] | JSX.Element;
}

export interface UserProviderState {
  user: User;
  update: (user: User) => void;
  token: () => Promise<string> | undefined;
  signup: (user: User, parents?: User[]) => Promise<void>;
  signupWithGoogle: (user?: User, parents?: User[]) => Promise<void>;
}

export const UserContext: React.Context<UserProviderState> = React.createContext(
  {
    user: new User(),
    update: (user: User) => {},
    token: (() => undefined) as () => Promise<string> | undefined,
    signup: async (user: User, parents?: User[]) => {},
    signupWithGoogle: async (user?: User, parents?: User[]) => {},
  }
);

export const useUser = () => React.useContext(UserContext);

/**
 * Class that manages authentication state and provides a `UserContext` provider
 * so all child components can access the current user's data.
 */
export class UserProvider extends React.Component<UserProviderProps> {
  public static readonly contextType: React.Context<
    DocumentReference
  > = DBContext;
  private static readonly auth: Auth = firebase.auth();
  public readonly state: UserProviderState;
  private authUnsubscriber?: Unsubscribe;
  private docUnsubscriber?: Unsubscribe;

  public constructor(props: UserProviderProps) {
    super(props);
    this.state = {
      user: new User(),
      update: (user: User) => this.setState({ user }),
      token: this.getToken,
      signup: this.signup,
      signupWithGoogle: this.signupWithGoogle,
    };
    this.getToken = this.getToken.bind(this);
    this.signup = this.signup.bind(this);
    this.signupWithGoogle = this.signupWithGoogle.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  private async handleChange(user: FirebaseUser | null): Promise<void> {
    if (user) {
      const userRecord: Partial<UserInterface> = {
        ref: this.context.collection('users').doc(user.uid),
        name: user.displayName || '',
        email: user.email || '',
        phone: user.phoneNumber || '',
        photo: user.photoURL || '',
        uid: user.uid,
      };
      this.setState({ user: new User(userRecord) });
      const withToken: Partial<UserInterface> = {
        ...userRecord,
        token: await user.getIdToken(),
      };
      this.setState({ user: new User(withToken) });
      const userDoc = (
        await to<DocumentSnapshot>((withToken.ref as DocumentReference).get())
      )[1];
      await this.updateDoc(
        userDoc,
        withToken.ref as DocumentReference,
        withToken
      );
    } else {
      this.setState({ user: new User() });
    }
  }

  private getToken(): Promise<string> | undefined {
    return UserProvider.auth.currentUser
      ? UserProvider.auth.currentUser.getIdToken()
      : undefined;
  }

  private async updateDoc(
    doc?: DocumentSnapshot,
    ref?: DocumentReference,
    user: Partial<UserInterface> = this.state.user
  ): Promise<void> {
    if (ref)
      this.docUnsubscriber = ref.onSnapshot((doc) => this.updateDoc(doc));
    if (doc && !doc.exists) {
      console.warn(`[WARNING] No document for current user (${user.uid}).`);
    } else if (doc) {
      console.log('[DEBUG] Got updated document data:', doc.data());
      const withData: User = User.fromFirestore(doc);
      console.log(
        '[DEBUG] Updating current user with document data:',
        withData
      );
      this.setState({ user: withData });
    }
  }

  public componentDidMount(): void {
    this.authUnsubscriber = UserProvider.auth.onAuthStateChanged(
      this.handleChange
    );
  }

  public componentWillUnmount(): void {
    if (this.authUnsubscriber) this.authUnsubscriber();
    if (this.docUnsubscriber) this.docUnsubscriber();
  }

  public render(): JSX.Element {
    return (
      <UserContext.Provider value={this.state}>
        {this.props.children}
      </UserContext.Provider>
    );
  }

  private async signupWithGoogle(
    user: User = new User(),
    parents?: User[]
  ): Promise<void> {
    const provider: AuthProvider = new firebase.auth.GoogleAuthProvider();
    const [err, cred] = await to<UserCredential, AuthError>(
      UserProvider.auth.signInWithPopup(provider)
    );
    if (err) {
      firebase.analytics().logEvent('exception', {
        description: `Error while signing up with Google. ${err.message}`,
        fatal: false,
      });
      throw err;
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
      AxiosResponse<{ user: UserJSONInterface }>,
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
        description: `User API responded with error: ${err.response.data}`,
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
        description: `User API did not respond: ${err.request}`,
        user: user.toJSON(),
        fatal: true,
      });
      throw new Error('User creation API did not respond.');
    } else if (err) {
      // Something happened in setting up the request that triggered
      // an err
      console.error('[ERROR] Calling user API:', err);
      firebase.analytics().logEvent('exception', {
        description: `Error calling user API: ${err}`,
        user: user.toJSON(),
        fatal: true,
      });
      throw new Error(`Error calling user API: ${err}`);
    } else if (res) {
      // TODO: Find a way to `this.setState()` with `res.data.user` ASAP
      // (instead of waiting on Firebase Auth to call our auth state listener).
      await UserProvider.auth.signInWithCustomToken(
        res.data.user.token as string
      );
      firebase.analytics().logEvent('login', {
        method: 'custom_token',
      });
    } else {
      // This should never actually happen, but we include it here just in case.
      console.warn('[WARNING] No error or response from user API.');
      firebase.analytics().logEvent('exception', {
        description: 'No error or response from user API.',
        user: user.toJSON(),
        fatal: true,
      });
      throw new Error('No error or response from user creation API.');
    }
  }
}
