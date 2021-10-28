import { animated, useSpring } from 'react-spring';
import { memo, useEffect, useMemo } from 'react';
import useSWR from 'swr';
import useTranslation from 'next-translate/useTranslation';
import { v4 as uuid } from 'uuid';

import Placeholder from 'components/placeholder';

import { User, UserJSON } from 'lib/model/user';
import { Callback } from 'lib/model/callback';
import { ListUsersRes } from 'lib/api/routes/users/list';
import { UsersQuery } from 'lib/model/query/users';
import clone from 'lib/utils/clone';
import { prefetch } from 'lib/fetch';

import { config, width } from './spring-animation';
import Result from './result';
import styles from './results-list.module.scss';

export interface ResultsListProps {
  query: UsersQuery;
  searching: boolean;
  setSearching: Callback<boolean>;
  setHits: Callback<number>;
  open: boolean;
}

function ResultsList({
  query,
  searching,
  setSearching,
  setHits,
  open,
}: ResultsListProps): JSX.Element {
  const { t } = useTranslation();
  const { data, isValidating } = useSWR<ListUsersRes>(query.endpoint);

  // Prefetch the next page of results (using SWR's global cache).
  // @see {@link https://swr.vercel.app/docs/prefetching}
  useEffect(() => {
    const nextPageQuery = new UsersQuery(
      clone({ ...query, page: query.page + 1 })
    );
    void prefetch(nextPageQuery.endpoint);
  }, [query]);

  // TODO: Avoid code duplication from the main search page by porting over all
  // of this logic into custom hooks or a shared lib directory.
  useEffect(() => setHits((prev) => data?.hits || prev), [setHits, data?.hits]);
  useEffect(() => {
    setSearching((prev) => prev && (isValidating || !data));
  }, [isValidating, data, setSearching]);

  const loadingRows: JSX.Element[] = useMemo(
    () =>
      // TODO: When we know there are only 3 results (i.e. results 111-113 of 113)
      // only show 3 loading rows. We'll have to include some pagination parsing
      // logic here (using `prevHits` and `query.page`).
      Array(query.hitsPerPage)
        .fill(null)
        .map(() => <Result loading key={uuid()} />),
    [query.hitsPerPage]
  );
  const props = useSpring({ config, marginLeft: open ? width : 0 });

  return (
    <animated.div data-cy='results' className={styles.wrapper} style={props}>
      {!searching &&
        (data?.users || []).map((user: UserJSON) => (
          <Result user={User.fromJSON(user)} key={user.id} />
        ))}
      {!searching && !(data?.users || []).length && (
        <div className={styles.empty}>
          <Placeholder>{t('users:empty')}</Placeholder>
        </div>
      )}
      {searching && loadingRows}
    </animated.div>
  );
}

export default memo(ResultsList);
