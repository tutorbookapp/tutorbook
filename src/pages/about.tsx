import React from 'react';

import CovidHead from '../head';
import Header from '../header';
import Footer from '../footer';
import About from '../about';

export default class AboutPage extends React.Component {
  render() {
    return (
      <>
        <CovidHead />
        <Header />
        <About />
        <Footer />
      </>
    );
  }
}
