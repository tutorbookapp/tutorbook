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
export default function useLoggedIn(href?: string, as?: string): void {
  const { loggedIn } = useUser();

  const url = useMemo(() => {
    let uri = '/login';
    if (href && as) {
      uri += `?href=${encodeURIComponent(href)}&as=${encodeURIComponent(as)}`;
    } else if (href) {
      uri += `?href=${encodeURIComponent(href)}`;
    }
    return uri;
  }, [href, as]);

  useEffect(() => {
    void Router.prefetch('/login', url);
  }, [url]);

  useEffect(() => {
    if (loggedIn === false) {
      void Router.push('/login', url);
    }
  }, [loggedIn, url]);
}
