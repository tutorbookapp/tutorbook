import { createContext, useContext } from 'react';

export type NavContextValue = () => void;

export const NavContext = createContext<NavContextValue>(() => {});

export const useNav = () => useContext<NavContextValue>(NavContext);
