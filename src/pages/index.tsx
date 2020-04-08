import React from 'react';

import Header from '../header';
import Footer from '../footer';
import HeroForm from '../hero-form';
import HeroAbout from '../hero-about';

export default class IndexPage extends React.Component {
  render() {
    return (
      <>
        <Header white />
        <HeroForm />
        <HeroAbout />
        <Footer />
      </>
    );
  }
}
