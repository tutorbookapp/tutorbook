import React from 'react';

import CovidHead from '../head';
import Header from '../header';
import Footer from '../footer';
import HeroForm from '../hero-form';
import HeroAbout from '../hero-about';

export default class IndexPage extends React.Component {
  public render(): JSX.Element {
    return (
      <>
        <CovidHead />
        <Header white />
        <HeroForm />
        <HeroAbout />
        <Footer />
      </>
    );
  }
}
