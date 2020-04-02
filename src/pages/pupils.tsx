import React from 'react'

import Header from '@tutorbook/covid-header'
import Footer from '@tutorbook/covid-footer'
import PupilForm from '@tutorbook/covid-pupil-form'

export default class PupilsPage extends React.Component {
  render() {
    return (
      <>
        <Header />
        <PupilForm />
        <Footer />
      </>
    );
  }
}
