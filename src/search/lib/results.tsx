import React from 'react';
import { UserInterface, FiltersInterface } from '@tutorbook/model';
import { SearchClient, SearchIndex } from 'algoliasearch/lite';
import {
  SearchOptions,
  SearchResponse,
  ObjectWithObjectID,
} from '@algolia/client-search';
import {
  List,
  ListItem,
  ListItemText,
  ListItemGraphic,
  ListItemPrimaryText,
  ListItemSecondaryText,
} from '@rmwc/list';
import { Avatar } from '@rmwc/avatar';

import to from 'await-to-js';
import algoliasearch from 'algoliasearch/lite';
import styles from './results.module.scss';

const algoliaId: string = 'XCRT9EA6O8';
const algoliaKey: string = 'aa1d293ac39b27e9671ece379c217da0';

type SearchHitAlias = UserInterface & ObjectWithObjectID;

interface SearchResultsState {
  results: ReadonlyArray<SearchHitAlias>;
}

interface SearchResultsProps {
  filters: FiltersInterface;
}

/**
 * Class that represents the search results view. This class contains most of
 * the querying heavy-lifting; just pass it some filters, and it'll show you the
 * most relevant results via our Algolia `users` index.
 */
export default class SearchResults extends React.Component<SearchResultsProps> {
  private static client: SearchClient = algoliasearch(algoliaId, algoliaKey);
  private static index: SearchIndex = SearchResults.client.initIndex(
    process.env.NODE_ENV === 'development' ? 'test-users' : 'default-users'
  );
  public state: SearchResultsState = {
    results: [],
  };

  public constructor(props: SearchResultsProps) {
    super(props);
    this.search();
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
  private get filterStrings(): string[] {
    let filterString: string = '(';
    for (let i = 0; i < this.props.filters.subjects.length; i++) {
      if (i !== 0) filterString += ' OR ';
      filterString += `subjects.explicit:"${this.props.filters.subjects[i]}"`;
    }
    const filterStrings: string[] = [];
    for (const timeslot of this.props.filters.availability)
      filterStrings.push(
        filterString +
          `) AND availability.from <= ${timeslot.from.valueOf()}` +
          ` AND availability.to >= ${timeslot.to.valueOf()}`
      );
    console.log('[DEBUG] Filters:', this.props.filters);
    console.log('[DEBUG] Resulted filter strings:', filterStrings);
    return filterStrings;
  }

  /**
   * Searches users based on the current filters by querying like:
   * > Show me all users whose availability contains a timeslot whose open time
   * > is equal to or before the desired open time and whose close time is equal
   * > to or after the desired close time.
   * Note that due to Algolia limitations, we must query for each availability
   * timeslot separately and then manually merge the results on the client side.
   */
  private async search(): Promise<void> {
    const results: SearchHitAlias[] = [];
    for (const filterString of this.filterStrings) {
      const options: SearchOptions = { filters: filterString };
      const [err, res]: [
        Object | null,
        SearchResponse<UserInterface> | undefined
      ] = await to(
        SearchResults.index.search('', options) as Promise<
          SearchResponse<UserInterface>
        >
      );
      if (err || !res) {
        console.error(`[ERROR] While searching ${filterString}:`, err);
      } else {
        res.hits.forEach((hit) => {
          if (results.findIndex((h) => h.objectID === hit.objectID) < 0)
            results.push(hit);
        });
      }
    }
    this.setState({
      results: results,
    });
  }

  public render(): JSX.Element {
    return (
      <List twoLine avatarList className={styles.resultsList}>
        {this.renderResults()}
      </List>
    );
  }

  private renderResults(): JSX.Element[] {
    return this.state.results.map((result: SearchHitAlias) => {
      return (
        <ListItem key={result.objectID}>
          <ListItemGraphic
            icon={
              <Avatar
                src='https://tutorbook.app/app/img/male.png'
                size='small'
                name={result.name}
              />
            }
          />
          <ListItemText>
            <ListItemPrimaryText>{result.name}</ListItemPrimaryText>
            <ListItemSecondaryText>{result.email}</ListItemSecondaryText>
          </ListItemText>
        </ListItem>
      );
    });
  }
}
