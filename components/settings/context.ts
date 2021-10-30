import { createContext, useContext } from 'react';

import { Callback } from 'lib/model/callback';
import { Org } from 'lib/model/org';

export interface SettingsContextValue {
  org: Org;
  setOrg: Callback<Org>;
}

export const SettingsContext = createContext<SettingsContextValue>({
  org: new Org(),
  setOrg: () => {},
});

export const useSettings = () =>
  useContext<SettingsContextValue>(SettingsContext);
