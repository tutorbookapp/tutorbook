import { memo, useMemo } from 'react';
import { animated, useSpring } from 'react-spring';
import useSWR from 'swr';

import { QueryInputs } from 'components/inputs';

import { Callback, CallbackParam, RequestJSON, UsersQuery } from 'lib/model';
import { ListRequestsRes } from 'lib/api/list-requests';
import Utils from 'lib/utils';

import { config, width } from './spring-animation';
import RequestItem from './request-item';
import styles from './filters-sheet.module.scss';

export interface FiltersSheetProps {
  query: UsersQuery;
  setQuery: Callback<UsersQuery>;
  open: boolean;
  matching: RequestJSON[];
  setMatching: Callback<RequestJSON[]>;
}

export default memo(function FiltersSheet({
  query,
  setQuery,
  open,
  matching,
  setMatching,
}: FiltersSheetProps): JSX.Element {
  const props = useSpring({ config, width: open ? width : 0 });
  const inputs = useMemo(
    () => (
      <QueryInputs
        value={query}
        onChange={setQuery}
        className={styles.field}
        renderToPortal
        availability
        subjects
        langs
      />
    ),
    [query, setQuery]
  );

  const { data } = useSWR<ListRequestsRes>('/api/requests');

  return (
    <animated.div className={styles.wrapper} style={props}>
      <div className={styles.content} style={{ width }}>
        <h4 className={styles.header}>More filters</h4>
        <form className={styles.form}>{inputs}</form>
        <h4 className={styles.header}>Queued requests</h4>
        <div className={styles.list}>
          {data &&
            data.requests.map((request: RequestJSON) => (
              <RequestItem
                checked={matching.findIndex((r) => r.id === request.id) >= 0}
                setChecked={(param: CallbackParam<boolean>) => {
                  let checked = false;
                  const idx = matching.findIndex((r) => r.id === request.id);
                  if (typeof param === 'function') checked = param(idx >= 0);
                  if (typeof param === 'boolean') checked = param;
                  if (checked) {
                    setMatching([...matching, request]);
                  } else {
                    setMatching([
                      ...matching.slice(0, idx),
                      ...matching.slice(idx + 1),
                    ]);
                  }
                }}
                request={request}
              />
            ))}
        </div>
      </div>
    </animated.div>
  );
});
