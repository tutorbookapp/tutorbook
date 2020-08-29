import { AppProps } from 'next/app';
import axios, { AxiosError, AxiosResponse } from 'axios';
import useSWR, { SWRConfig, mutate } from 'swr';
import to from 'await-to-js';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import Router from 'next/router';
import NProgress from 'nprogress';

import CovidHead from 'components/doc-head';

import { UpdateOrgParam, UpdateUserParam, UserContext } from 'lib/account';
import { ApiError, Org, OrgJSON, User, UserJSON } from 'lib/model';

import 'styles/global.scss';

NProgress.configure({ trickleSpeed: 500, minimum: 0.2, showSpinner: false });

async function fetcher<T>(url: string): Promise<T> {
  const [err, res] = await to<AxiosResponse<T>, AxiosError<ApiError>>(
    axios.get<T>(url)
  );
  const error: (description: string) => never = (description: string) => {
    throw new Error(description);
  };
  if (err && err.response) {
    error(`API (${url}) responded with error: ${err.response.data.msg}`);
  } else if (err && err.request) {
    error(`API (${url}) did not respond.`);
  } else if (err) {
    error(`${err.name} calling API (${url}): ${err.message}`);
  }
  return (res as AxiosResponse<T>).data;
}

// Installs a service worker and triggers an `/api/account` re-validation once
// the service worker has been activated and is control of this page (i.e. once
// the service worker can intercept our fetch requests and append the auth JWT).
// @see {@link https://bit.ly/3gnChWt}
async function installServiceWorker(): Promise<void> {
  if ('serviceWorker' in navigator) {
    await navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg: ServiceWorkerRegistration) => {
        reg.addEventListener('updatefound', () => {
          const worker = reg.installing as ServiceWorker;
          worker.addEventListener('statechange', () => {
            if (worker.state === 'activated') {
              void mutate('/api/account');
            }
          });
        });
      });
  } else {
    throw new Error('Service workers are disabled.');
  }
}

async function updateUserRemote(user: User): Promise<void> {
  const url = `/api/users/${user.id}`;
  const { data: updatedUser } = await axios.put<UserJSON>(url, user.toJSON());
  await mutate('/api/account', updatedUser, false);
}

export default function App({ Component, pageProps }: AppProps): JSX.Element {
  // The user account state must be defined as a hook here. Otherwise, it gets
  // reset during client-side page navigation.
  // TODO: Currently, calling `updateUser` triggers an eventual remote data
  // update which we don't want. Instead, each component should have an explicit
  // "update" button that:
  // 1. Shows a loading state that prevents further user input.
  // 2. Locally mutates data (to start any expensive re-rendering).
  // 3. Calls POST or PUT API to update remote data.
  // 4. If error, resets local data and shows error message. Otherwise, locally
  //    mutates data with server response.
  // 5. Hides loading state. Data has been updated (or error received).
  const initialPageLoad = useRef<boolean>(true);
  const { data, error } = useSWR<UserJSON, Error>('/api/account', fetcher);
  const user = useMemo(() => (data ? User.fromJSON(data) : new User()), [data]);
  const loggedIn = useMemo(() => {
    if (user.id) {
      initialPageLoad.current = false;
      return true;
    }
    if (error) {
      initialPageLoad.current = false;
      return false;
    }
    if (initialPageLoad.current) return undefined;
    return false;
  }, [user, error]);
  const updateUserTimeoutId = useRef<ReturnType<typeof setTimeout>>();
  const updateUser = useCallback(
    async (param: UpdateUserParam) => {
      if (updateUserTimeoutId.current) {
        clearTimeout(updateUserTimeoutId.current);
        updateUserTimeoutId.current = undefined;
      }
      let updatedUser: User = user;
      if (typeof param === 'object') updatedUser = new User(param);
      if (typeof param === 'function') updatedUser = new User(param(user));
      // Re-validate if we haven't gotten any account data yet. This fixes
      // an issue where the profile view would locally update to an empty
      // `User()` *before* our `/api/account` endpoint could respond. SWR
      // cancelled the `/api/account` mutation in favor of the empty one.
      await mutate('/api/account', updatedUser, !loggedIn);
      // Only update the user profile remotely after 5secs of no change.
      // @see {@link https://github.com/vercel/swr/issues/482}
      updateUserTimeoutId.current = setTimeout(() => {
        if (updatedUser.id) void updateUserRemote(updatedUser);
      }, 5000);
    },
    [user, loggedIn]
  );

  // Consumers can update local app-wide org data (proxy to SWR's mutate FN).
  const { data: orgsData } = useSWR<OrgJSON[]>('/api/orgs', fetcher);
  const orgs = useMemo(() => {
    return orgsData ? orgsData.map((o: OrgJSON) => Org.fromJSON(o)) : [];
  }, [orgsData]);
  const updateOrg = useCallback(
    async (id: string, param: UpdateOrgParam) => {
      const idx = orgs.findIndex((org: Org) => org.id === id);
      if (idx < 0) throw new Error(`Org (${id}) not found in local data.`);
      let updatedOrg: Org = orgs[idx];
      if (typeof param === 'object') updatedOrg = new Org(param);
      if (typeof param === 'function') updatedOrg = new Org(param(updatedOrg));
      const updated = [
        ...orgs.map((org: Org) => org.toJSON()).slice(0, idx),
        updatedOrg.toJSON(),
        ...orgs.map((org: Org) => org.toJSON()).slice(idx + 1),
      ];
      await mutate('/api/orgs', updated, false);
    },
    [orgs]
  );

  // This service worker appends the Firebase Authentication JWT to all of our
  // same-origin fetch requests. In the future, it'll handle caching as well.
  useEffect(() => {
    void installServiceWorker();
  }, []);

  // Dynamically import our Firebase SDK initialization (because it's so big) to
  // connect Google Analytics with our Firebase project automatically.
  useEffect(() => {
    const initFirebaseAndAnalytics = () => import('lib/firebase');
    void initFirebaseAndAnalytics();
  }, []);

  const loaderTimeoutId = useRef<ReturnType<typeof setTimeout>>();
  Object.entries({
    routeChangeStart: () => {
      // Only show loader if page transition takes longer than 0.5sec.
      loaderTimeoutId.current = setTimeout(() => NProgress.start(), 500);
    },
    routeChangeComplete: () => NProgress.done(),
    routeChangeError: () => NProgress.done(),
  }).forEach(([event, action]) => {
    Router.events.on(event, () => {
      if (loaderTimeoutId.current) {
        clearTimeout(loaderTimeoutId.current);
        loaderTimeoutId.current = undefined;
      }
      action();
    });
  });

  return (
    <SWRConfig value={{ fetcher }}>
      <UserContext.Provider
        value={{ user, orgs, updateUser, updateOrg, loggedIn }}
      >
        <div id='portal' />
        <CovidHead />
        <Component {...pageProps} />
      </UserContext.Provider>
    </SWRConfig>
  );
}
