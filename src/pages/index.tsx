import React from 'react'

import Header from '../header'
import Footer from '../footer'
import TutorForm from '../tutor-form'

export default class IndexPage extends React.Component {
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
