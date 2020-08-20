import { memo } from 'react';
import { animated, useSpring } from 'react-spring';
import useMeasure from 'react-use-measure';
import useSWR from 'swr';

import { QueryInputs } from 'components/inputs';

import { Callback, UsersQuery, RequestJSON } from 'lib/model';
import { ListRequestsRes } from 'lib/api/list-requests';
import Utils from 'lib/utils';

import { config, width } from './spring-animation';
import RequestItem from './request-item';
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
  const props = useSpring({ config, width: open ? width : 0 });

  const { data } = useSWR<ListRequestsRes>('/api/requests');

  return (
    <animated.div className={styles.wrapper} style={props}>
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
          <RequestItem request={request} onClick={() => {}} />
        ))}
    </animated.div>
  );
});
