import React from 'react';
import Utils from '@tutorbook/covid-utils';
import UserDialog from '@tutorbook/user-dialog';
import CheckmarkOverlay from '@tutorbook/checkmark-overlay';
import { UserContext } from '@tutorbook/firebase';
import {
  AttendeeInterface,
  FiltersInterface,
  Timeslot,
  Appt,
  User,
  UserJSONInterface,
} from '@tutorbook/model';
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
import { FormattedMessage } from 'react-intl';
import { AxiosResponse, AxiosError } from 'axios';

import axios from 'axios';
import to from 'await-to-js';

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
  public static readonly contextType: React.Context<User> = UserContext;

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
    const params: Record<string, string> = {
      subjects: encodeURIComponent(JSON.stringify(this.props.filters.subjects)),
      availability: this.props.filters.availability.toURLParam(),
    };
    const [err, res] = await to<AxiosResponse, AxiosError>(
      axios({
        method: 'get',
        url: '/api/search',
        params: params,
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
      this.setState({
        searching: false,
        results: res.data.map((user: UserJSONInterface) => User.fromJSON(user)),
      });
    } else {
      console.warn('[WARNING] No error or response from search REST API.');
      this.setState({ searching: false, results: [] });
    }
    window.clearTimeout(loaderTimeoutID);
  }

  /**
   * Guesses at the `Appt` that the user wants to create (based on the current
   * filters); this is the object that pre-fills the `UserDialog`'s lesson form.
   */
  private get appt(): Appt {
    if (!this.state.viewing) return new Appt();

    const attendees: AttendeeInterface[] = [
      {
        uid: this.state.viewing.uid,
        roles: ['tutor'],
      },
      {
        uid: this.context.uid,
        roles: ['pupil'],
      },
    ];
    const subjects: string[] = Utils.intersection<string>(
      this.props.filters.subjects,
      this.state.viewing.subjects.explicit
    );
    const times: Timeslot[] = Utils.intersection<Timeslot>(
      this.props.filters.availability,
      this.state.viewing.availability,
      (a, b) => a.equalTo(b)
    );

    return new Appt({ attendees, subjects, time: times[0] });
  }

  public render(): JSX.Element {
    return (
      <>
        {!!this.state.viewing && (
          <UserDialog
            appt={this.appt}
            user={this.state.viewing}
            onClose={() => this.setState({ viewing: undefined })}
          />
        )}
        <List twoLine avatarList>
          <CheckmarkOverlay active={this.state.searching} />
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
                className={styles.avatar}
                size='small'
                name={result.name}
              />
            }
          />
          <ListItemText>
            <ListItemPrimaryText>{result.name}</ListItemPrimaryText>
            <ListItemSecondaryText>{result.bio}</ListItemSecondaryText>
          </ListItemText>
        </ListItem>
      ));
    } else {
      return (
        <div className={styles.noResults}>
          <Typography use='headline5'>
            <FormattedMessage
              id='search.results.no-results'
              description='No results text.'
              defaultMessage='No results'
            />
          </Typography>
        </div>
      );
    }
  }
}
