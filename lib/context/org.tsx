import { createContext, useContext } from 'react';

import { Org } from 'lib/model';

export interface OrgContextValue {
  org?: Org;
}

export const OrgContext = createContext<OrgContextValue>({});

export const useOrg = () => useContext<OrgContextValue>(OrgContext);
