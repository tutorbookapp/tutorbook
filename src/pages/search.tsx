import React from 'react';

import Header from '../header';
import Footer from '../footer';
import Search from '../search';

import { FiltersInterface, Availability, TimeUtils } from '../model';

const filters: FiltersInterface = {
  subjects: ['Trigonometry', 'World History'],
  availability: Availability.fromFirestore([
    {
      from: TimeUtils.getDate(1, 12), // Mondays at 12pm
      to: TimeUtils.getDate(1, 17), // Mondays at 5pm
    },
    {
      from: TimeUtils.getDate(0, 7), // Sundays at 7am
      to: TimeUtils.getDate(0, 12), // Sundays at 12pm
    },
  ]),
};

export default class SearchPage extends React.Component {
  public render(): JSX.Element {
    return (
      <>
        <Header white />
        <Search filters={filters} />
        <Footer />
      </>
    );
  }
}
