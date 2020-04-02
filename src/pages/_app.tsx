import { AppProps } from 'next/app'

import '@tutorbook/covid-styles'

import '@material/textfield/dist/mdc.textfield.css'
import '@material/select/dist/mdc.select.css'
import '@material/card/dist/mdc.card.css'
import '@material/button/dist/mdc.button.css'

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}
