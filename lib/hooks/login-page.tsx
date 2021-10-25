import Router, { useRouter } from 'next/router';
import { useEffect, useMemo } from 'react';

import { useUser } from 'lib/context/user';

import usePage from './page';

// A "Login Page" is any page that should redirect to the overview (or another
// specified redirect location) if the user is logged in. Typically, these are
// pages that have to do with the user logging in (e.g. an auth failed page).
export default function useLoginPage(name: string): void {
  const { loggedIn } = useUser();
  const { query } = useRouter();

  const redirect = useMemo(
    () => decodeURIComponent((query.href as string) || 'overview'),
    [query.href]
  );
  useEffect(() => {
    if (loggedIn) {
      void Router.push(redirect);
    }
  }, [redirect, loggedIn]);
  useEffect(() => {
    void Router.prefetch(redirect);
  }, [redirect]);

  usePage(name, { login: false, admin: false });
}
