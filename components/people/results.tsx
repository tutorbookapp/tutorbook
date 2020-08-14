import React, { useEffect, useMemo } from 'react';
import useSWR, { mutate } from 'swr';
import { v4 as uuid } from 'uuid';

import Placeholder from 'components/placeholder';
import Result from 'components/search/result';

import { ListUsersRes } from 'lib/api/list-users';
import { UsersQuery } from 'lib/model';

import styles from './results.module.scss';

export interface ResultsProps {
  query: UsersQuery;
}

export default function Results({ query }: ResultsProps): JSX.Element {
  const { data, isValidating } = useSWR<ListUsersRes>(query.endpoint);

  useEffect(() => {
    setSearching(true);
    void mutate(query.endpoint);
  }, [query]);
  useEffect(() => {
    setSearching((prev: boolean) => prev && (isValidating || !data));
  }, [isValidating, data]);

  const loadingRows: JSX.Element[] = useMemo(
    () =>
      Array(query.hitsPerPage)
        .fill(null)
        .map(() => <Result loading key={uuid()} />),
    [query.hitsPerPage]
  );

  return (
    <>
      {!searching &&
        (data ? data.users : []).map((user, idx) => (
          <Result user={User.fromJSON(user)} key={user.id} />
        ))}
      {!searching && !(data ? data.users : []).length && (
        <div className={styles.empty}>
          <Placeholder>{t('people:empty')}</Placeholder>
        </div>
      )}
      {searching && loadingRows}
    </>
  );
}
