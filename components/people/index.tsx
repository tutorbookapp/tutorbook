import React, { useEffect, useState } from 'react';

import { Org, UsersQuery } from 'lib/model';

import SearchBar from './search-bar';
import ResultsList from './results-list';
import FiltersSheet from './filters-sheet';
import Header from './header';
import Pagination from './pagination';
import styles from './people.module.scss';

interface PeopleProps {
  org: Org;
}

/**
 * The "People" view is a heterogenous combination of live-updating filtered
 * results and editability (similar to Google Sheets):
 * - Data automatically re-validates when filters are valid.
 * - Filters become invalid when data is edited or new users are being created.
 * - Creating new users locally updates the SWR data and calls the `/api/users`
 * API endpoint when the user has a valid email address.
 * - Local edits are pushed to remote after 5secs of no change.
 * @see {@link https://github.com/tutorbookapp/tutorbook/issues/87}
 * @see {@link https://github.com/tutorbookapp/tutorbook/issues/75}
 */
export default function People({ org }: PeopleProps): JSX.Element {
  const [filtersOpen, setFiltersOpen] = useState<boolean>(false);
  const [query, setQuery] = useState<UsersQuery>(
    new UsersQuery({
      orgs: [{ label: org.name, value: org.id }],
      hitsPerPage: 5,
    })
  );
  const [hits, setHits] = useState<number>(query.hitsPerPage);

  useEffect(() => {
    setQuery(
      (prev: UsersQuery) =>
        new UsersQuery({
          ...prev,
          orgs: [{ label: org.name, value: org.id }],
        })
    );
  }, [org]);

  return (
    <>
      <Header orgId={org.id} orgName={org.name} />
      <div className={styles.wrapper}>
        <SearchBar query={query} setQuery={setQuery} setOpen={setFiltersOpen} />
        <div className={styles.content}>
          <FiltersSheet
            query={query}
            setQuery={setQuery}
            open={filtersOpen}
            setOpen={setFiltersOpen}
          />
          <ResultsList query={query} setQuery={setQuery} setHits={setHits} />
        </div>
        <Pagination query={query} setQuery={setQuery} hits={hits} />
      </div>
    </>
  );
}
