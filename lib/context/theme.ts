import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { Callback } from 'lib/model/callback';

export type Theme = 'system' | 'dark' | 'light';
export interface ThemeContextType {
  theme: Theme;
  setTheme: Callback<Theme>;
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  setTheme: () => {},
});

export function useTheme(): ThemeContextType & { dark: boolean } {
  const { theme, setTheme } = useContext(ThemeContext);
  const [dark, setDark] = useState(theme === 'dark');
  useEffect(() => {
    setDark(
      theme === 'dark' ||
        (theme === 'system' &&
          typeof matchMedia !== 'undefined' &&
          matchMedia('(prefers-color-scheme: dark)').matches)
    );
  }, [theme]);
  return useMemo(() => ({ theme, setTheme, dark }), [theme, setTheme, dark]);
}
