import { AppProps } from 'next/app';

import DBProvider from '../firebase/db';
import UserProvider from '../firebase/user';

import '../styles';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <DBProvider>
      <Component {...pageProps} />
    </DBProvider>
  );
}
