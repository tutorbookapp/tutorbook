import React from 'react';
import Intercom from 'react-intercom';
import { AppProps } from 'next/app';
import { RMWCProvider } from '@rmwc/provider';
import { IntlProvider } from 'react-intl';

import { UserProvider, UserContext, DBProvider } from '../firebase';
import { User } from '../model';
import CovidHead from '../head';
import '../styles';

import en from '../translations/en.json';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <IntlProvider
      locale='en'
      messages={en}
      defaultLocale='en'
      onError={(error) => console.error('[ERROR] Setting up i18n:', error)}
    >
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
            <UserContext.Consumer>
              {(user: User) => (
                <Intercom appID='faz7lcyb' {...user.toIntercom()} />
              )}
            </UserContext.Consumer>
          </RMWCProvider>
        </UserProvider>
      </DBProvider>
    </IntlProvider>
  );
}
