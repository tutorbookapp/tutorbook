import React, { useEffect, useState } from 'react';

import { Org, UsersQuery } from 'lib/model';

import Results from './results';
import Filters from './filters';
import Header from './header';
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
  const [query, setQuery] = useState<UsersQuery>(
    new UsersQuery({
      orgs: [{ label: org.name, value: org.id }],
      hitsPerPage: 10,
    })
  );

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
        <Filters query={query} setQuery={setQuery} />
        <Results query={query} setQuery={setQuery} />
      </div>
    </>
  );
}
