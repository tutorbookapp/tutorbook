import { memo, useEffect, useMemo, useState } from 'react';
import { animated, useSpring } from 'react-spring';
import useSWR, { mutate } from 'swr';
import { v4 as uuid } from 'uuid';
import useTranslation from 'next-translate/useTranslation';

import Placeholder from 'components/placeholder';
import Result from 'components/search/result';

import { Callback, TCallback, User, UserJSON, UsersQuery } from 'lib/model';
import { ListUsersRes } from 'lib/api/routes/users/list';

import { config, width } from './spring-animation';
import styles from './results-list.module.scss';

export interface ResultsListProps {
  query: UsersQuery;
  setHits: Callback<number>;
  setViewing: TCallback<UserJSON | undefined>;
  open: boolean;
}

export default memo(function ResultsList({
  query,
  setHits,
  setViewing,
  open,
}: ResultsListProps): JSX.Element {
  const [searching, setSearching] = useState<boolean>(true);

  const { t } = useTranslation();
  const { data, isValidating } = useSWR<ListUsersRes>(query.endpoint);

  useEffect(() => setHits((prev) => data?.hits || prev), [setHits, data?.hits]);
  useEffect(() => {
    setSearching(true);
    void mutate(query.endpoint);
  }, [query]);
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
        (data ? data.users : []).map((user: UserJSON) => (
          <Result
            onClick={() => setViewing(user)}
            user={User.fromJSON(user)}
            className={styles.item}
            key={user.id}
          />
        ))}
      {!searching && !(data ? data.users : []).length && (
        <div className={styles.empty}>
          <Placeholder>{t('people:empty')}</Placeholder>
        </div>
      )}
      {searching && loadingRows}
    </animated.div>
  );
});
