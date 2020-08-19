import { memo, useEffect, useRef } from 'react';
import { animated, useSpring } from 'react-spring';
import { ResizeObserver as polyfill } from '@juggle/resize-observer';
import { Ripple } from '@rmwc/ripple';
import cn from 'classnames';
import useMeasure from 'react-use-measure';
import useSWR from 'swr';

import { QueryInputs } from 'components/inputs';

import Utils from 'lib/utils';
import { ListRequestsRes } from 'lib/api/list-requests';
import { Callback, UsersQuery, RequestJSON } from 'lib/model';

import { config, width } from './spring-animation';
import styles from './filters-sheet.module.scss';

const canUseDOM = !!(
  typeof window !== 'undefined' &&
  window.document &&
  window.document.createElement
);

interface RequestItemProps {
  request: RequestJSON;
  loading?: boolean;
  onClick: () => void;
}

function RequestItem({
  request,
  loading,
  onClick,
}: RequestItemProps): JSX.Element {
  const bioRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const truncateBio = async () => {
      if (loading || !canUseDOM) return;
      const Dotdotdot = (await import('@tutorbook/dotdotdot-js')).default;
      /* eslint-disable-next-line no-new */
      if (bioRef.current) new Dotdotdot(bioRef.current, { watch: 'resize' });
    };
    void truncateBio();
  });

  return (
    <Ripple disabled={loading} onClick={onClick}>
      <li className={cn(styles.item, { [styles.loading]: loading })}>
        <div className={styles.name}>
          {Utils.join(request.people.map((p) => p.id))}
        </div>
        <div ref={bioRef} className={styles.bio}>
          {request.message}
        </div>
      </li>
    </Ripple>
  );
}

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
