import React from 'react';

import CovidHead from '../head';
import Header from '../header';
import Footer from '../footer';
import PupilForm from '../pupil-form';

export default class PupilsPage extends React.Component {
  public render(): JSX.Element {
    return (
      <>
        <CovidHead />
        <Header sticky />
        <PupilForm />
        <Footer />
      </>
    );
  }
}
