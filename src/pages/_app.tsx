import { AppProps } from 'next/app';

import DBProvider from '../firebase/db';

import '../styles';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <DBProvider>
      <Component {...pageProps} />
    </DBProvider>
  );
}
