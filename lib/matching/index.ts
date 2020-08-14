import { createContext, useContext } from 'react';

import { Callback, CallbackParam, UserJSON } from 'lib/model';

export interface MatchingContextValue {
  user?: UserJSON;
  updateUser: Callback<UserJSON | undefined>;
}

export const MatchingContext = createContext<MatchingContextValue>({
  user: undefined,
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  updateUser: (param: CallbackParam<UserJSON | undefined>) => {},
});

export const useMatching = () => useContext(MatchingContext);
