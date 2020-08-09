import { ListUsersRes } from 'lib/api/list-users';
import { UsersQuery, Org, User } from 'lib/model';

import React, { useMemo, useEffect, useState } from 'react';
import UserDialog from 'components/user-dialog';

import Pagination from './pagination';
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
  const [searching, setSearching] = useState<boolean>(true);
  const [viewingIdx, setViewingIdx] = useState<number>();
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
      {data && viewingIdx !== undefined && (
        <UserDialog
          onClosed={() => setViewingIdx(undefined)}
          initialData={data.users[viewingIdx]}
          initialPage='display'
        />
      )}
      <Header orgId={org.id} orgName={org.name} />
      <div className={styles.wrapper}>
        <Filters query={query} setQuery={setQuery} />
        <Results query={query} />
        <Pagination
          hits={data ? data.hits : 0}
          query={query}
          setQuery={setQuery}
        />
      </div>
    </>
  );
}
