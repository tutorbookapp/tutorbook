import { AppProps } from 'next/app'

import DBProvider from '../firebase/db'
import UserProvider from '../firebase/user'

import '../styles'

import '@material/textfield/dist/mdc.textfield.css'
import '@material/select/dist/mdc.select.css'
import '@material/card/dist/mdc.card.css'
import '@material/button/dist/mdc.button.css'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <DBProvider>
      <Component {...pageProps} />
    </DBProvider>
  );
}
