import React from 'react';
import { AppProps } from 'next/app';
import { RMWCProvider } from '@rmwc/provider';

import { UserProvider, DBProvider } from '../firebase';
import { User } from '../model';
import CovidHead from '../covid-head';
import '../covid-styles';

export default function App({ Component, pageProps, router }: AppProps) {
  return (
    <DBProvider>
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
    </DBProvider>
  );
}
