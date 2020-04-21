import React from 'react';
import { User as FirebaseUser, Unsubscribe, auth } from 'firebase';
import { User, UserInterface } from '@tutorbook/model';

import firebase from './base';

// TODO: Import these directly w/out use of type aliases.
type ActionCodeSettings = auth.ActionCodeSettings;
type Auth = auth.Auth;

interface UserProviderProps {
  children: JSX.Element[] | JSX.Element;
}

interface UserProviderState {
  user: User;
}

export const UserContext: React.Context<User> = React.createContext(new User());

export const useUser = () => React.useContext(UserContext);

/**
 * Class that manages authentication state and provides a `UserContext` provider
 * so all child components can access the current user's data.
 */
export class UserProvider extends React.Component<UserProviderProps> {
  private static auth: Auth = firebase.auth();
  public readonly state: UserProviderState = {
    user: new User(),
  };
  private unsubscriber?: Unsubscribe;

  public constructor(props: UserProviderProps) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }

  private handleChange(user: FirebaseUser | null): void {
    if (user) {
      const userRecord: Partial<UserInterface> = {
        name: user.displayName || '',
        email: user.email || '',
        phone: user.phoneNumber || '',
        photo: user.photoURL || '',
        uid: user.uid,
      };
      this.setState({ user: new User(userRecord) });
    }
  }

  public componentDidMount(): void {
    this.unsubscriber = UserProvider.auth.onAuthStateChanged(this.handleChange);
  }

  public componentWillUnmount(): void {
    if (this.unsubscriber) this.unsubscriber();
  }

  public render(): JSX.Element {
    return (
      <UserContext.Provider value={this.state.user}>
        {this.props.children}
      </UserContext.Provider>
    );
  }

  /**
   * Sends an authentication link to the given user's email address to log them
   * in.
   *
   * There are numerous benefits to signing in by email:
   * - Low friction sign-up and sign-in.
   * - Lower risk of password reuse across applications, which can undermine
   *   security of even well-selected passwords.
   * - The ability to authenticate a user while also verifying that the user is
   *   the legitimate owner of an email address.
   * - A user only needs an accessible email account to sign in. No ownership of
   *   a phone number or social media account is required.
   * - A user can sign in securely without the need to provide (or remember) a
   *   password, which can be cumbersome on a mobile device.
   * - An existing user who previously signed in with an email identifier
   *   (password or federated) can be upgraded to sign in with just the email.
   *   For example, a user who has forgotten their password can still sign in
   *   without needing to reset their password.
   *
   * @see {@link https://firebase.google.com/docs/auth/web/email-link-auth}
   */
  public static async signUp(user: User): Promise<void> {
    const settings: ActionCodeSettings = {
      url:
        window.location.protocol +
        '//' +
        window.location.hostname +
        ':' +
        window.location.port +
        user.searchURL,
      handleCodeInApp: true,
    };
    user.setLocalStorage();
    return UserProvider.auth.sendSignInLinkToEmail(user.email, settings);
  }

  public static attemptSignIn(
    url: string = window.location.href
  ): Promise<void> | void {
    console.log('[DEBUG] Attempting to sign-in:', url);
    if (UserProvider.auth.isSignInWithEmailLink(url))
      return UserProvider.signIn(url);
  }

  public static async signIn(
    url: string = window.location.href
  ): Promise<void> {
    let email: string | null = window.localStorage.getItem('user-email');
    if (!email)
      email = window.prompt('Please provide your email for confirmation.');
    await UserProvider.auth.signInWithEmailLink(email as string, url);
    console.log('[DEBUG] Signed in:', UserProvider.auth.currentUser);
  }
}
