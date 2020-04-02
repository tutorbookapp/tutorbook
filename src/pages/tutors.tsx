import React from 'react'

import Header from '@tutorbook/covid-header'
import Footer from '@tutorbook/covid-footer'
import TutorForm from '@tutorbook/covid-tutor-form'

export default class TutorsPage extends React.Component {
  render() {
    return (
      <>
        <Header />
        <TutorForm />
        <Footer />
      </>
    );
  }
}
