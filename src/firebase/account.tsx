import React from 'react';
import { User, UserJSON } from '@tutorbook/model';
import useSWR from 'swr';

export interface UserContextValue {
  user: User;
  updateUser: (user: User) => Promise<void>;
}

export const UserContext = React.createContext({
  user: new User(),
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  updateUser: async (user: User) => {},
});

export const useUser = () => React.useContext(UserContext);

interface UserProviderProps {
  children: JSX.Element | JSX.Element[];
}

export function UserProvider({ children }: UserProviderProps): JSX.Element {
  const { data: user, mutate } = useSWR<UserJSON>('/api/account');

  // This service worker appends the Firebase Authentication JWT to all of our
  // same-origin fetch requests. In the future, it'll handle caching as well.
  React.useEffect(() => {
    if ('serviceWorker' in navigator) {
      console.log('[DEBUG] Installing service worker...');
      void navigator.serviceWorker.register('/sw.js', { scope: '/' });
    } else {
      console.warn('[WARNING] Service worker is disabled.');
    }
  }, []);

  return (
    <UserContext.Provider
      value={{
        user: User.fromJSON(user || new User().toJSON()),
        updateUser: async (newUser: User) => {
          await mutate(newUser.toJSON());
        },
      }}
    >
      {children}
    </UserContext.Provider>
  );
}
