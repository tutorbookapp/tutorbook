import React from 'react';
import { Card } from '@rmwc/card';
import { Grid, GridCell } from '@rmwc/grid';
import { Typography } from '@rmwc/typography';
import { User, UserJSONInterface, FiltersInterface } from '@tutorbook/model';
import { AxiosResponse, AxiosError } from 'axios';

import axios from 'axios';
import to from 'await-to-js';

import Filter from './filter';
import SearchResults from './results';
import styles from './search.module.scss';

/**
 * We have a `results` property in this props object so we can use SSR to fetch
 * and render the user's initial search results (we can't use the
 * `getServerSideProps` function here; it has to be in the `SearchPage` itself).
 */
interface SearchProps {
  filters: FiltersInterface;
  results: ReadonlyArray<User>;
}

interface SearchState {
  filters: FiltersInterface;
}

export default class Search extends React.Component<SearchProps> {
  public readonly state: SearchState;

  /**
   * Creates a new `Search` view.
   * @todo Make `SearchProps` extends the standard HTML props and then spread
   * those props to our wrapper element.
   */
  public constructor(props: SearchProps) {
    super(props);
    this.state = { filters: props.filters };
  }

  public static async search(
    filters: FiltersInterface
  ): Promise<ReadonlyArray<User>> {
    const [err, res] = await to<AxiosResponse, AxiosError>(
      axios({
        method: 'get',
        url: '/api/search',
        params: {
          subjects: encodeURIComponent(JSON.stringify(filters.subjects)),
          availability: filters.availability.toURLParam(),
        },
      })
    );
    if (err && err.response) {
      console.error(`[ERROR] ${err.response.data}`);
      throw new Error(err.response.data);
    } else if (err && err.request) {
      console.error('[ERROR] Search REST API did not respond:', err.request);
      throw new Error('Search REST API did not respond.');
    } else if (err) {
      console.error('[ERROR] While sending request:', err);
      throw new Error(`While sending request: ${err.message}`);
    } else if (res) {
      return res.data.map((user: UserJSONInterface) => User.fromJSON(user));
    } else {
      console.warn('[WARNING] No error or response from search REST API.');
      return [];
    }
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
      <>
        <div className={styles.searchWrapper}>
          <div className={styles.searchContent}>
            <Typography className={styles.searchHeader} use='headline2'>
              Search
            </Typography>
            <Grid className={styles.searchGrid}>
              <GridCell span={4}>
                <Card className={styles.searchCard}>
                  <Filter
                    filters={this.state.filters}
                    onChange={(filters) => this.setState({ filters })}
                  />
                </Card>
              </GridCell>
              <GridCell span={8}>
                <Card className={styles.searchCard}>
                  <SearchResults
                    results={this.props.results}
                    filters={this.state.filters}
                  />
                </Card>
              </GridCell>
            </Grid>
          </div>
        </div>
        <div className={styles.searchBackground} />
      </>
    );
  }
}
