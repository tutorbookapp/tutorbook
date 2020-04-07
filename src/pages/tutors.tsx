import React from 'react'

import Header from '../header'
import Footer from '../footer'
import TutorForm from '../tutor-form'

export default class TutorsPage extends React.Component {
  render() {
    return (
      <>
        <Header sticky />
        <TutorForm />
        <Footer />
      </>
    );
  }
}
