import { useEffect, useMemo, useRef, useState } from 'react';
import useSWR, { mutate } from 'swr';
import { v4 as uuid } from 'uuid';
import useTranslation from 'next-translate/useTranslation';

import Placeholder from 'components/placeholder';
import UserDialog from 'components/user-dialog';
import Result from 'components/search/result';

import { ListUsersRes } from 'lib/api/list-users';
import { Callback, User, UsersQuery } from 'lib/model';

import Pagination from './pagination';
import styles from './results.module.scss';

export interface ResultsProps {
  query: UsersQuery;
  setQuery: Callback<UsersQuery>;
}

export default function Results({
  query,
  setQuery,
}: ResultsProps): JSX.Element {
  const [searching, setSearching] = useState<boolean>(true);
  const [viewingIdx, setViewingIdx] = useState<number>();

  const { t } = useTranslation();
  const { data, isValidating } = useSWR<ListUsersRes>(query.endpoint);

  const prevHits = useRef<number>(query.hitsPerPage);
  useEffect(() => {
    if (data) prevHits.current = data.hits;
  });

  useEffect(() => {
    setSearching(true);
    void mutate(query.endpoint);
  }, [query]);
  useEffect(() => {
    setSearching((prev: boolean) => prev && (isValidating || !data));
  }, [isValidating, data]);

  const loadingRows: JSX.Element[] = useMemo(() => {
    // TODO: When we know there are only 3 results (i.e. results 111-113 of 113)
    // only show 3 loading rows. We'll have to include some pagination parsing
    // logic here (using `prevHits` and `query.page`).
    return Array(query.hitsPerPage)
      .fill(null)
      .map(() => <Result loading key={uuid()} />);
  }, [query.hitsPerPage]);

  return (
    <>
      {data && viewingIdx !== undefined && (
        <UserDialog
          onClosed={() => setViewingIdx(undefined)}
          initialData={data.users[viewingIdx]}
          initialPage='display'
          setQuery={setQuery}
        />
      )}
      {!searching &&
        (data ? data.users : []).map((user, idx) => (
          <Result
            onClick={() => setViewingIdx(idx)}
            user={User.fromJSON(user)}
            key={user.id}
          />
        ))}
      {!searching && !(data ? data.users : []).length && (
        <div className={styles.empty}>
          <Placeholder>{t('people:empty')}</Placeholder>
        </div>
      )}
      {searching && loadingRows}
      <Pagination
        hits={data ? data.hits : prevHits.current}
        query={query}
        setQuery={setQuery}
      />
    </>
  );
}
