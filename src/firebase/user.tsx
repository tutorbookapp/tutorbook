import React from 'react';
import { ApiError, User, UserJSON, UserInterface } from '@tutorbook/model';
import axios, { AxiosError, AxiosResponse } from 'axios';
import to from 'await-to-js';

import { DBContext } from './db';
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

interface UserProviderState {
  user: User;
}

export interface UserContextValue extends UserProviderState {
  update: (user: User) => void;
  token: () => Promise<string> | undefined;
  signup: (user: User, parents?: User[]) => Promise<void>;
  signupWithGoogle: (user?: User, parents?: User[]) => Promise<void>;
}

export const UserContext: React.Context<UserContextValue> = React.createContext(
  {
    user: new User(),
    update: (user: User) => {},
    token: (() => undefined) as () => Promise<string> | undefined,
    signup: async (user: User, parents?: User[]) => {},
    signupWithGoogle: async (user?: User, parents?: User[]) => {},
  }
);

export function useUser(): UserContextValue {
  return React.useContext(UserContext);
}

/**
 * Class that manages authentication state and provides a `UserContext` provider
 * so all child components can access the current user's data.
 */
export class UserProvider extends React.Component<
  UserProviderProps,
  UserProviderState
> {
  public static readonly contextType: React.Context<
    DocumentReference
  > = DBContext;

  private static readonly auth: Auth = firebase.auth();

  public readonly context: DocumentReference;

  private authUnsubscriber?: Unsubscribe;

  private docUnsubscriber?: Unsubscribe;

  public constructor(props: UserProviderProps, context: DocumentReference) {
    super(props);
    this.context = context;
    this.state = { user: new User() };
    this.signup = this.signup.bind(this);
    this.signupWithGoogle = this.signupWithGoogle.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  private static getToken(): Promise<string> | undefined {
    return UserProvider.auth.currentUser
      ? UserProvider.auth.currentUser.getIdToken()
      : undefined;
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

  private async handleChange(user: FirebaseUser | null): Promise<void> {
    if (user) {
      const userRecord: Partial<UserInterface> = {
        /* eslint-disable-next-line react/destructuring-assignment */
        ref: this.context.collection('users').doc(user.uid),
        name: user.displayName || '',
        email: user.email || '',
        phone: user.phoneNumber || '',
        photo: user.photoURL || '',
        id: user.uid,
      };
      this.setState({ user: new User(userRecord) });
      const withToken: Partial<UserInterface> = {
        ...userRecord,
        token: await user.getIdToken(),
      };
      this.setState({ user: new User(withToken) });
      const userDoc = await (withToken.ref as DocumentReference).get();
      this.updateDoc(userDoc, withToken.ref as DocumentReference);
    } else {
      this.setState({ user: new User() });
    }
  }

  private updateDoc(doc?: DocumentSnapshot, ref?: DocumentReference): void {
    if (ref) this.docUnsubscriber = ref.onSnapshot((d) => this.updateDoc(d));
    if (doc && doc.exists) {
      const withData: User = User.fromFirestore(doc);
      this.setState({ user: withData });
    }
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
    } else if (res) {
      this.setState({ user: User.fromJSON(res.data.user) });
      await UserProvider.auth.signInWithCustomToken(
        res.data.user.token as string
      );
      firebase.analytics().logEvent('login', {
        method: 'custom_token',
      });
    } else {
      // This should never actually happen, but we include it here just in case.
      firebase.analytics().logEvent('exception', {
        description: 'No error or response from user API.',
        user: user.toJSON(),
        fatal: true,
      });
      throw new Error('No error or response from user creation API.');
    }
  }

  public render(): JSX.Element {
    const { user } = this.state;
    const { children } = this.props;
    return (
      <UserContext.Provider
        value={{
          user,
          update: (newUser: User) => this.setState({ user: newUser }),
          token: UserProvider.getToken,
          signup: this.signup,
          signupWithGoogle: this.signupWithGoogle,
        }}
      >
        {children}
      </UserContext.Provider>
    );
  }
}
