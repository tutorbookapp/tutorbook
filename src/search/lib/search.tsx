import React from 'react';
import { Card } from '@rmwc/card';
import { Grid, GridCell } from '@rmwc/grid';
import { Typography } from '@rmwc/typography';
import { User, UserSearchHitAlias, FiltersInterface } from '@tutorbook/model';
import { SearchClient, SearchIndex } from 'algoliasearch/lite';
import { SearchOptions, SearchResponse } from '@algolia/client-search';

import to from 'await-to-js';
import algoliasearch from 'algoliasearch/lite';

import Filter from './filter';
import SearchResults from './results';
import styles from './search.module.scss';

const algoliaId: string = 'XCRT9EA6O8';
const algoliaKey: string = 'aa1d293ac39b27e9671ece379c217da0';

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
  private static client: SearchClient = algoliasearch(algoliaId, algoliaKey);
  private static index: SearchIndex = Search.client.initIndex(
    process.env.NODE_ENV === 'development' ? 'test-users' : 'default-users'
  );
  public readonly state: SearchState;

  /**
   * Searches users based on the current filters by querying like:
   * > Show me all users whose availability contains a timeslot whose open time
   * > is equal to or before the desired open time and whose close time is equal
   * > to or after the desired close time.
   * Note that due to Algolia limitations, we must query for each availability
   * timeslot separately and then manually merge the results on the client side.
   */
  public static async search(
    filters: FiltersInterface
  ): Promise<ReadonlyArray<User>> {
    const results: User[] = [];
    let filterStrings: (string | undefined)[] = Search.getFilterStrings(
      filters
    );
    if (!filterStrings.length) filterStrings = [undefined];
    for (const filterString of filterStrings) {
      const options: SearchOptions | undefined = filterString
        ? { filters: filterString }
        : undefined;
      const [err, res]: [
        Object | null,
        SearchResponse<UserSearchHitAlias> | undefined
      ] = await to(
        Search.index.search('', options) as Promise<
          SearchResponse<UserSearchHitAlias>
        >
      );
      if (err || !res) {
        console.error(`[ERROR] While searching ${filterString}:`, err);
      } else {
        res.hits.forEach((hit) => {
          if (results.findIndex((h) => h.uid === hit.objectID) < 0)
            results.push(User.fromSearchHit(hit));
        });
      }
    }
    return results;
  }

  /**
   * Creates and returns the filter string to search our Algolia index based on
   * `this.props.filters`. Note that due to Algolia restrictions, we **cannot**
   * nest ANDs with ORs (e.g. `(A AND B) OR (B AND C)`). Because of this
   * limitation, we merge results from many queries on the client side (e.g. get
   * results for `A AND B` and merge them with the results for `B AND C`).
   * @example
   * '(subjects.explicit:"Chemistry H" OR subjects.explicit:"Chemistry") AND ' +
   * '((availability.from <= 1587304800001 AND availability.to >= 1587322800000))'
   * @see {@link https://www.algolia.com/doc/guides/managing-results/refine-results/filtering/how-to/filter-by-date/?language=javascript}
   * @see {@link https://www.algolia.com/doc/guides/managing-results/refine-results/filtering/in-depth/combining-boolean-operators/#combining-ands-and-ors}
   * @see {@link https://www.algolia.com/doc/guides/managing-results/refine-results/filtering/how-to/filter-arrays/?language=javascript}
   */
  public static getFilterStrings(filters: FiltersInterface): string[] {
    let filterString: string = '';
    for (let i = 0; i < filters.subjects.length; i++) {
      filterString += i === 0 ? '(' : ' OR ';
      filterString += `subjects.explicit:"${filters.subjects[i]}"`;
      if (i === filters.subjects.length - 1) filterString += ')';
    }
    if (filters.availability.length && filters.subjects.length)
      filterString += ' AND ';
    const filterStrings: string[] = [];
    for (const timeslot of filters.availability)
      filterStrings.push(
        filterString +
          `(availability.from <= ${timeslot.from.valueOf()}` +
          ` AND availability.to >= ${timeslot.to.valueOf()})`
      );
    if (!filters.availability.length) filterStrings.push(filterString);
    return filterStrings;
  }

  /**
   * Creates a new `Search` view.
   * @todo Make `SearchProps` extends the standard HTML props and then spread
   * those props to our wrapper element.
   */
  public constructor(props: SearchProps) {
    super(props);
    this.state = { filters: props.filters };
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
