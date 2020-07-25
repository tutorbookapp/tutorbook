import { AppProps } from 'next/app';
import { RMWCProvider } from '@rmwc/provider';
import { SWRConfig } from 'swr';
import { ApiError } from 'lib/model';
import { UserProvider } from 'lib/account';

import axios, { AxiosError, AxiosResponse } from 'axios';
import to from 'await-to-js';

import React, { useRef, useEffect } from 'react';
import Router from 'next/router';
import NProgress from 'nprogress';
import CovidHead from 'components/doc-head';

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

export default function App({ Component, pageProps }: AppProps): JSX.Element {
  const timeoutId = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const initFirebaseAndAnalytics = () => import('lib/firebase');
    void initFirebaseAndAnalytics();
  }, []);

  Object.entries({
    routeChangeStart: () => {
      // Only show loader if page transition takes longer than 0.5sec.
      timeoutId.current = setTimeout(() => NProgress.start(), 500);
    },
    routeChangeComplete: () => NProgress.done(),
    routeChangeError: () => NProgress.done(),
  }).forEach(([event, action]) =>
    Router.events.on(event, () => {
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
        timeoutId.current = undefined;
      }
      action();
    })
  );

  return (
    <SWRConfig value={{ fetcher }}>
      <UserProvider>
        <RMWCProvider
          typography={{
            defaultTag: 'div',
            headline1: 'h1',
            headline2: 'h2',
            headline3: 'h3',
            headline4: 'h4',
            headline5: 'h5',
            headline6: 'h6',
            body1: 'p',
            body2: 'p',
          }}
        >
          <div id='portal' />
          <CovidHead />
          <Component {...pageProps} />
        </RMWCProvider>
      </UserProvider>
    </SWRConfig>
  );
}
