import React from 'react';

import { User, UserInterface, OrgJSON, ApiError } from 'lib/model';

import useSWR, { responseInterface } from 'swr';

export function useOrgs(): Omit<
  responseInterface<OrgJSON[], ApiError>,
  'data'
> & { orgs: OrgJSON[] } {
  const { data: orgs, ...rest } = useSWR<OrgJSON[]>('/api/orgs');
  return { orgs: orgs || [], ...rest };
}

export type UpdateUserParam = UserInterface | ((prev: User) => UserInterface);

export interface UserContextValue {
  user: User;
  updateUser: (user: UpdateUserParam) => Promise<void>;
}

export const UserContext = React.createContext({
  user: new User(),
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  updateUser: async (user: UpdateUserParam) => {},
});

export const useUser = () => React.useContext(UserContext);
