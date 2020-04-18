import React from 'react';
import UserDialog from '@tutorbook/user-dialog';
import AnimatedCheckmarkOverlay from '@tutorbook/animated-checkmark-overlay';
import { User, FiltersInterface } from '@tutorbook/model';
import {
  List,
  ListItem,
  ListItemText,
  ListItemGraphic,
  ListItemPrimaryText,
  ListItemSecondaryText,
} from '@rmwc/list';
import { Avatar } from '@rmwc/avatar';
import { Typography } from '@rmwc/typography';

import Search from './search';
import styles from './results.module.scss';

interface SearchResultsState {
  results: ReadonlyArray<User>;
  searching: boolean;
  viewing?: User;
}

interface SearchResultsProps {
  results: ReadonlyArray<User>;
  filters: FiltersInterface;
}

/**
 * Class that represents the search results view. This class contains most of
 * the querying heavy-lifting; just pass it some filters, and it'll show you the
 * most relevant results via our Algolia `users` index.
 */
export default class SearchResults extends React.Component<SearchResultsProps> {
  public readonly state: SearchResultsState;

  /**
   * Initial results are passed as a prop so we can support SSR data fetching
   * (i.e. fetch the initial results from the server-side based on the user's
   * query in our `SearchPage`; see `src/pages/search.tsx` for more info).
   */
  public constructor(props: SearchResultsProps) {
    super(props);
    this.state = {
      results: props.results,
      searching: false,
    };
  }

  /**
   * We must call `this.search` from within this lifecycle method in order for
   * the search results to be updated every time our `props.filters` are
   * updated.
   * @see {@link https://reactjs.org/docs/react-component.html#componentdidupdate}
   * @see {@link https://reactjs.org/docs/lifting-state-up.html#lifting-state-up}
   */
  public componentDidUpdate(prevProps: SearchResultsProps): void {
    if (this.props.filters !== prevProps.filters) this.search();
  }

  /**
   * Note that we wait half a second (500ms) before showing a loader (as we
   * don't want to show a flash to the users; most Algolia searches take less
   * than what we'd need to show a loader for).
   */
  private async search(): Promise<void> {
    const loaderTimeoutID: number = window.setTimeout(
      () => this.setState({ searching: true }),
      500
    );
    const results: ReadonlyArray<User> = await Search.search(
      this.props.filters
    );
    window.clearTimeout(loaderTimeoutID);
    this.setState({ searching: false, results: results });
  }

  public render(): JSX.Element {
    return (
      <>
        {!!this.state.viewing && <UserDialog user={this.state.viewing} />}
        <List twoLine avatarList>
          <AnimatedCheckmarkOverlay active={this.state.searching} />
          {this.renderResults()}
        </List>
      </>
    );
  }

  private renderResults(): JSX.Element | JSX.Element[] {
    if (this.state.results.length) {
      return this.state.results.map((result: User) => (
        <ListItem
          key={result.uid}
          onClick={() => this.setState({ viewing: result })}
        >
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
      ));
    } else {
      return (
        <div className={styles.noResults}>
          <Typography use='headline5'>No results</Typography>
        </div>
      );
    }
  }
}
