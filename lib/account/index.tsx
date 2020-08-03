import { createContext, useContext } from 'react';

import { User, UserInterface, Org } from 'lib/model';

export type UpdateUserParam = UserInterface | ((prev: User) => UserInterface);

export interface UserContextValue {
  user: User;
  orgs: Org[];
  updateUser: (user: UpdateUserParam) => Promise<void>;
  loggedIn?: boolean;
}

export const UserContext = createContext<UserContextValue>({
  user: new User(),
  orgs: [],
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  updateUser: async (user: UpdateUserParam) => {},
  loggedIn: undefined,
});

export const useUser = () => useContext<UserContextValue>(UserContext);
