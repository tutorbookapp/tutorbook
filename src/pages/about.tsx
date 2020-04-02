import React from 'react'

import Header from '@tutorbook/covid-header'
import Footer from '@tutorbook/covid-footer'
import About from '@tutorbook/covid-about'

export default class AboutPage extends React.Component {
  render() {
    return (
      <>
        <Header />
        <About />
        <Footer />
      </>
    );
  }
}
