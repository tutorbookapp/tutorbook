// See: https://github.com/zeit/next.js/tree/master/examples/with-firebase

import { UserInfo } from '@firebase/auth-types';
import { useState, useEffect, createContext, useContext } from 'react';
import firebase from './index';

interface UserContextProps {
  user: UserInfo;
  setUser: (user: UserInfo) => void;
  loadingUser: boolean;
}

export const UserContext = createContext({} as UserContextProps);

// Custom hook that short-hands the context!
export const useUser = () => useContext(UserContext);

export default function UserProvider({
  children,
}: {
  children: JSX.Element[] | JSX.Element;
}) {
  const [user, setUser] = useState({} as UserInfo);
  // Helpful, to update the UI accordingly.
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    // Listen for an authenticated or un-authenticated user.
    const unsubscriber = firebase.auth().onAuthStateChanged(async (user) => {
      try {
        if (user) {
          // User is signed in.
          const { uid, displayName, email, photoURL } = user;
          // You could also look for the user doc in your Firestore:
          // const doc = await firebase.firestore().doc(`users/${uid}`).get();
          setUser({ uid, displayName, email, photoURL } as UserInfo);
        } else setUser({} as UserInfo);
      } catch (error) {
        // Most probably a connection error. Handle appropriately.
      } finally {
        setLoadingUser(false);
      }
    });

    // Unsubscribe authentication listener on `unmount`.
    return () => unsubscriber();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, loadingUser }}>
      {children}
    </UserContext.Provider>
  );
}
