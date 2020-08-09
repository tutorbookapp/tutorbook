import { v4 as uuid } from 'uuid';
import useSWR, { mutate } from 'swr';
import useTranslation from 'next-translate/useTranslation';

import { ListUsersRes } from 'lib/api/list-users';
import { UsersQuery, Org, User } from 'lib/model';

import React, { useMemo, useEffect, useState } from 'react';
import UserDialog from 'components/user-dialog';
import Result from 'components/search/result';
import Placeholder from 'components/placeholder';

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

  const loadingRows: JSX.Element[] = useMemo(
    () =>
      Array(query.hitsPerPage)
        .fill(null)
        .map(() => <Result loading key={uuid()} />),
    [query.hitsPerPage]
  );

  const { t } = useTranslation();
  const { data, isValidating } = useSWR<ListUsersRes>(query.endpoint);

  useEffect(() => {
    setQuery(
      (prev: UsersQuery) =>
        new UsersQuery({
          ...prev,
          orgs: [{ label: org.name, value: org.id }],
        })
    );
  }, [org]);
  useEffect(() => {
    setSearching(true);
    void mutate(query.endpoint);
  }, [query]);
  useEffect(() => {
    setSearching((prev: boolean) => prev && (isValidating || !data));
  }, [isValidating, data]);

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
        {!searching &&
          (data ? data.users : []).map((user, idx) => (
            <Result
              user={User.fromJSON(user)}
              key={user.id}
              onClick={() => setViewingIdx(idx)}
            />
          ))}
        {searching && loadingRows}
        {!searching && !(data ? data.users : []).length && (
          <div className={styles.empty}>
            <Placeholder>{t('people:empty')}</Placeholder>
          </div>
        )}
        <Pagination
          hits={data ? data.hits : 0}
          query={query}
          setQuery={setQuery}
        />
      </div>
    </>
  );
}
