import React from 'react';

import Header from '../header';
import Footer from '../footer';
import Search from '../search';

export default class SearchPage extends React.Component {
  public render(): JSX.Element {
    return (
      <>
        <Header />
        <Search />
        <Footer />
      </>
    );
  }
}
