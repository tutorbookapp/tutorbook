import { useEffect, useMemo } from 'react';
import Router from 'next/router';

import { useUser } from 'lib/context/user';

/**
 * Custom hook that redirects to the login page if a user isn't currently
 * authenticated.
 * @example
 * ```typescript
 * function DashboardPage(): JSX.Element {
 *   useLoggedIn('/dashboard');
 * }
 */
export default function useLoggedIn(href?: string): void {
  const { loggedIn } = useUser();

  const url = useMemo(() => {
    return href ? `/login?href=${encodeURIComponent(href)}` : '/login';
  }, [href]);

  useEffect(() => {
    void Router.prefetch(url);
  }, [url]);

  useEffect(() => {
    if (loggedIn === false) {
      void Router.push(url);
    }
  }, [loggedIn, url]);
}
