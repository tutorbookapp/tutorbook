import React from 'react';

import Header from '../components/header';
import Footer from '../components/footer';
import PupilForm from '../components/pupil-form';

class App extends React.Component {
  render() {
    return (
      <div>
        <Header/>
        <PupilForm />
        <Footer />
      </div>
    );
  }
}

export default App;
