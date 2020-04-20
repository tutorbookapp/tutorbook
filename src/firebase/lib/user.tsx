import React from 'react';
import { User as FirebaseUser } from '@firebase/auth-types';
import { User, UserInterface } from '@tutorbook/model';
import { Unsubscribe } from 'firebase';

import firebase from './base';

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
    this.unsubscriber = firebase.auth().onAuthStateChanged(this.handleChange);
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
}
