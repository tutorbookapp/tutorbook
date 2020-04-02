import React from 'react';

import Header from '@tutorbook/covid-header';
import Footer from '@tutorbook/covid-footer';
import Form from '@tutorbook/covid-form';

class App extends React.Component {
  render() {
    return (
      <div>
        <Header/>
        <Form />
        <Footer />
      </div>
    );
  }
}

export default App;
