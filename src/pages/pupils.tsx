import React from 'react';

import Header from '../header';
import Footer from '../footer';
import PupilForm from '../pupil-form';

export default class PupilsPage extends React.Component {
  public render(): JSX.Element {
    return (
      <>
        <Header sticky />
        <PupilForm />
        <Footer />
      </>
    );
  }
}
