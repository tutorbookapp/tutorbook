import { animated, useSpring } from 'react-spring';
import { ResizeObserver as polyfill } from '@juggle/resize-observer';
import useMeasure from 'react-use-measure';

import { Callback, UsersQuery } from 'lib/model';

import styles from './filters-sheet.module.scss';

export interface FiltersSheetProps {
  query: UsersQuery;
  setQuery: Callback<UsersQuery>;
  open: boolean;
  setOpen: Callback<boolean>;
}

export default function FiltersSheet({
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

  return (
    <animated.div style={{ overflow: 'hidden', ...props }}>
      <div ref={ref} className={styles.wrapper} />
    </animated.div>
  );
}
