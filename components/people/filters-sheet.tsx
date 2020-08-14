import { memo } from 'react';
import { animated, useSpring } from 'react-spring';
import { ResizeObserver as polyfill } from '@juggle/resize-observer';
import useMeasure from 'react-use-measure';
import useSWR from 'swr';

import { QueryInputs } from 'components/inputs';

import Utils from 'lib/utils';
import { ListRequestsRes } from 'lib/api/list-requests';
import { Callback, UsersQuery, RequestJSON } from 'lib/model';

import styles from './filters-sheet.module.scss';

export interface FiltersSheetProps {
  query: UsersQuery;
  setQuery: Callback<UsersQuery>;
  open: boolean;
  setOpen: Callback<boolean>;
}

export default memo(function FiltersSheet({
  query,
  setQuery,
  open,
  setOpen,
}: FiltersSheetProps): JSX.Element {
  const [ref, { width }] = useMeasure({ polyfill });
  const props = useSpring({
    width: open ? width : 0,
    config: { tension: 250, friction: 32, clamp: true },
  });

  const { data } = useSWR<ListRequestsRes>('/api/requests');

  return (
    <animated.div style={{ overflow: 'hidden', ...props }}>
      <div ref={ref} className={styles.wrapper}>
        <form className={styles.form}>
          <QueryInputs
            value={query}
            onChange={setQuery}
            className={styles.field}
            renderToPortal
            availability
            subjects
            langs
          />
        </form>
        {data &&
          data.requests.map((request: RequestJSON) => (
            <div>
              <h4>{`ID: ${request.id}`}</h4>
              <p>{`Subjects: ${Utils.join(request.subjects)}`}</p>
              <p>{`People IDs: ${Utils.join(
                request.people.map((p) => p.id)
              )}`}</p>
              <p>{`Message: ${request.message}`}</p>
            </div>
          ))}
      </div>
    </animated.div>
  );
});
