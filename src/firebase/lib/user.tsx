import React from 'react';
import { User as FirebaseUser, Unsubscribe, auth } from 'firebase';
import { User, UserInterface } from '@tutorbook/model';
import { AxiosError, AxiosResponse } from 'axios';

import axios from 'axios';
import to from 'await-to-js';
import firebase from './base';

// TODO: Import these directly w/out use of type aliases.
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

  public static async signup(user: User, parent?: User): Promise<void> {
    const [err, res] = await to<
      AxiosResponse<{ token: string }>,
      AxiosError<string>
    >(
      axios({
        method: 'post',
        url: '/api/user',
        data: {
          user: user.toJSON(),
          parent: parent ? parent.toJSON() : parent,
        },
      })
    );
    if (err && err.response) {
      // The request was made and the server responded with a status
      // code that falls out of the range of 2xx
      console.error(`[ERROR] ${err.response.data}`);
    } else if (err && err.request) {
      // The request was made but no response was received
      // `err.request` is an instance of XMLHttpRequest in the
      // browser and an instance of http.ClientRequest in node.js
      console.error('[ERROR] No response received:', err.request);
    } else if (err) {
      // Something happened in setting up the request that triggered
      // an err
      console.error('[ERROR] While sending request:', err);
    } else if (res) {
      await UserProvider.auth.signInWithCustomToken(res.data.token);
    }
  }
}
