import React from 'react';

import CovidHead from '../head';
import Header from '../header';
import Footer from '../footer';
import TutorForm from '../tutor-form';

export default class TutorsPage extends React.Component {
  public render(): JSX.Element {
    return (
      <>
        <CovidHead />
        <Header sticky />
        <TutorForm />
        <Footer />
      </>
    );
  }
}
