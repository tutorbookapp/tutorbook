import { useEffect, useMemo } from 'react';
import Router from 'next/router';

import { useUser } from 'lib/context/user';

export interface PageData {
  name: string;
  url?: string;
  org?: string;
  login?: boolean;
  admin?: boolean;
}

export default function usePage({
  name,
  url,
  org = 'default',
  login,
  admin,
}: PageData): void {
  const { loggedIn, orgs } = useUser();

  // Redirect to the login page if authentication is required but missing.
  const loginURL = useMemo(() => {
    return url ? `/login?href=${encodeURIComponent(url)}` : '/login';
  }, [url]);
  useEffect(() => {
    if (login) {
      void Router.prefetch(loginURL);
    }
  }, [login, loginURL]);
  useEffect(() => {
    if (login && loggedIn === false) {
      void Router.replace(loginURL);
    }
  }, [login, loggedIn, loginURL]);

  // Log the analytics page event specifying a name for easier grouping (e.g. it
  // is practically impossible to identify a page by dynamic URL alone).
  useEffect(() => {
    // The `orgId` prop is required to connect events with Mixpanel groups.
    // @see {@link https://bit.ly/36YrRsT}
    window.analytics?.page('', name, { orgId: org });
  }, [name, org]);

  // Redirect to a 404 page if admin access is required but missing.
  // TODO: Should we instead redirect to a 403 page?
  useEffect(() => {
    if (admin) {
      void Router.prefetch('/404');
    }
  }, [admin]);
  useEffect(() => {
    if (admin && loggedIn === true && !orgs.some((o) => o.id === org)) {
      void Router.replace('/404');
    }
  }, [admin, loggedIn, orgs, org]);
}
