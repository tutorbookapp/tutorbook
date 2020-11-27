import { animated, useSpring } from 'react-spring';
import { memo, useEffect, useMemo, useState } from 'react';
import useSWR, { mutate } from 'swr';
import useTranslation from 'next-translate/useTranslation';
import { v4 as uuid } from 'uuid';

import Placeholder from 'components/placeholder';
import Result from 'components/search/result';

import { Callback, User, UserJSON, UsersQuery } from 'lib/model';
import { ListUsersRes } from 'lib/api/routes/users/list';
import clone from 'lib/utils/clone';
import { prefetch } from 'lib/fetch';
import { useOrg } from 'lib/context/org';

import { config, width } from './spring-animation';
import styles from './results-list.module.scss';

export interface ResultsListProps {
  query: UsersQuery;
  setHits: Callback<number>;
  open: boolean;
}

export default memo(function ResultsList({
  query,
  setHits,
  open,
}: ResultsListProps): JSX.Element {
  const [searching, setSearching] = useState<boolean>(true);

  // Throttle new requests (e.g. when using text-based search, don't send a new
  // request for every letter changed until 500ms of no change).
  const [endpoint, setEndpoint] = useState<string>('');
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setEndpoint(query.endpoint);
      void mutate(query.endpoint);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [query.endpoint]);

  const { org } = useOrg();
  const { t } = useTranslation();
  const { data, isValidating } = useSWR<ListUsersRes>(endpoint);

  // Prefetch the next page of results (using SWR's global cache).
  // @see {@link https://swr.vercel.app/docs/prefetching}
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const nextPageQuery = new UsersQuery(
        clone({ ...query, page: query.page + 1 })
      );
      void prefetch(nextPageQuery.endpoint);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [query]);

  // TODO: Avoid code duplication from the main search page by porting over all
  // of this logic into custom hooks or a shared lib directory.
  useEffect(() => setHits((prev) => data?.hits || prev), [setHits, data?.hits]);
  useEffect(() => setSearching(true), [query]);
  useEffect(() => {
    setSearching((prev) => prev && (isValidating || !data));
  }, [isValidating, data]);

  const loadingRows: JSX.Element[] = useMemo(() => {
    // TODO: When we know there are only 3 results (i.e. results 111-113 of 113)
    // only show 3 loading rows. We'll have to include some pagination parsing
    // logic here (using `prevHits` and `query.page`).
    return Array(query.hitsPerPage)
      .fill(null)
      .map(() => <Result className={styles.item} loading key={uuid()} />);
  }, [query.hitsPerPage]);
  const props = useSpring({ config, marginLeft: open ? width : 0 });

  return (
    <animated.div data-cy='results' className={styles.wrapper} style={props}>
      {!searching &&
        (data?.users || []).map((user: UserJSON) => (
          <Result
            href={`/${org?.id || ''}/users/${user.id}`}
            user={User.fromJSON(user)}
            className={styles.item}
            key={user.id}
            newTab
          />
        ))}
      {!searching && !(data?.users || []).length && (
        <div className={styles.empty}>
          <Placeholder>{t('users:empty')}</Placeholder>
        </div>
      )}
      {searching && loadingRows}
    </animated.div>
  );
});
