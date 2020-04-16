import React from 'react';
import { TimeUtils, Availability, FiltersInterface } from '@tutorbook/model';

import Filter from './filter';
import SearchResults from './results';
import styles from './search.module.scss';

interface SearchProps {}

interface SearchState {
  filters: FiltersInterface;
}

export default class Search extends React.Component<SearchProps> {
  public readonly state: SearchState = {
    filters: {
      subjects: ['Chemistry H'],
      availability: Availability.fromFirestore([
        {
          from: TimeUtils.getDate(1, 12), // Mondays at 12pm
          to: TimeUtils.getDate(1, 17), // Mondays at 5pm
        },
        {
          from: TimeUtils.getDate(2, 7), // Tuesdays at 7am
          to: TimeUtils.getDate(2, 12), // Tuesdays at 12pm
        },
      ]),
    },
  };

  /**
   * Creates a new `Search` view.
   * @todo Make `SearchProps` extends the standard HTML props and then spread
   * those props to our wrapper element.
   */
  public constructor(props: SearchProps) {
    super(props);
  }

  /**
   * Renders (and returns) the search view which consists of:
   * - The standard site header
   * - A nice decorative header title
   * - A `Filter` side bar that enables the user to refine their initial search
   * - The `SearchResults` component which searches our Algolia index and shows
   * the most relevant results.
   */
  public render(): JSX.Element {
    return (
      <div className={styles.searchWrapper}>
        <Filter
          filters={this.state.filters}
          onChange={(filters) => this.setState({ filters: filters })}
        />
        <SearchResults filters={this.state.filters} />
      </div>
    );
  }
}
