import React from 'react';

import Header from '../header';
import Footer from '../footer';
import About from '../about';

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
