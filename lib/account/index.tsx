import React from 'react';

import { User, UserJSON } from 'lib/model';

import useSWR, { mutate } from 'swr';
import axios from 'axios';

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

/**
 * Installs a service worker and triggers an `/api/account` re-validation once
 * the service worker has been activated and is control of this page (i.e. once
 * the service worker can intercept our fetch requests and append the auth JWT).
 * @see {@link https://developers.google.com/web/fundamentals/primers/service-workers/lifecycle#handling_updates}
 */
async function installServiceWorker(): Promise<void> {
  if ('serviceWorker' in navigator) {
    await navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg: ServiceWorkerRegistration) => {
        reg.addEventListener('updatefound', () => {
          const worker = reg.installing as ServiceWorker;
          worker.addEventListener('statechange', () => {
            if (worker.state === 'activated') {
              void mutate('/api/account');
            }
          });
        });
      });
  } else {
    throw new Error('Service workers are disabled.');
  }
}

async function updateUser(user: User): Promise<void> {
  const url = `/api/users/${user.id}`;
  const { data: updatedUser } = await axios.put<UserJSON>(url, user.toJSON());
  await mutate('/api/account', updatedUser, false);
}

export function UserProvider({ children }: UserProviderProps): JSX.Element {
  const { data: user } = useSWR<UserJSON>('/api/account');
  const timeoutId = React.useRef<ReturnType<typeof setTimeout>>();

  // This service worker appends the Firebase Authentication JWT to all of our
  // same-origin fetch requests. In the future, it'll handle caching as well.
  React.useEffect(() => {
    void installServiceWorker();
  }, []);

  return (
    <UserContext.Provider
      value={{
        user: user ? User.fromJSON(user) : new User(),
        updateUser: async (updatedUser: User) => {
          if (timeoutId.current) {
            clearTimeout(timeoutId.current);
            timeoutId.current = undefined;
          }
          // Re-validate if we haven't gotten any account data yet. This fixes
          // an issue where the profile view would locally update to an empty
          // `User()` *before* our `/api/account` endpoint could respond. SWR
          // cancelled the `/api/account` mutation in favor of the empty one.
          await mutate('/api/account', updatedUser, !user);
          // Only update the user profile remotely after 5secs of no change.
          // @see {@link https://github.com/vercel/swr/issues/482}
          timeoutId.current = setTimeout(() => {
            if (updatedUser.id) void updateUser(updatedUser);
          }, 5000);
        },
      }}
    >
      {children}
    </UserContext.Provider>
  );
}
