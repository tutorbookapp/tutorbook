import { animated, useSpring } from 'react-spring';
import { memo } from 'react';

import Placeholder from 'components/placeholder';

import { Callback, MeetingsQuery } from 'lib/model';

import { config, width } from './spring-animation';
import styles from './filters-sheet.module.scss';

export interface FiltersSheetProps {
  query: MeetingsQuery;
  setQuery: Callback<MeetingsQuery>;
  filtersOpen: boolean;
}

function FiltersSheet({
  query,
  setQuery,
  filtersOpen,
}: FiltersSheetProps): JSX.Element {
  const props = useSpring({ config, width: filtersOpen ? width : 0 });

  return (
    <animated.div className={styles.wrapper} style={props}>
      <div className={styles.content} style={{ width }}>
        <Placeholder>FILTERS COMING SOON</Placeholder>
      </div>
    </animated.div>
  );
}

export default memo(FiltersSheet);
