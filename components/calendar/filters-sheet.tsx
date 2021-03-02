import { animated, useSpring } from 'react-spring';
import { memo, useCallback } from 'react';

import SubjectSelect from 'components/subject-select';
import UserSelect from 'components/user-select';

import { Callback } from 'lib/model/callback';
import { MeetingsQuery } from 'lib/model/query/meetings';
import { Option } from 'lib/model/query/base';

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

  const onSubjectsChange = useCallback(
    (subjects: Option<string>[]) => {
      setQuery((prev) => new MeetingsQuery({ ...prev, subjects, page: 0 }));
    },
    [setQuery]
  );
  const onPeopleChange = useCallback(
    (people: Option<string>[]) => {
      setQuery((prev) => new MeetingsQuery({ ...prev, people, page: 0 }));
    },
    [setQuery]
  );

  return (
    <animated.div className={styles.wrapper} style={props}>
      <form className={styles.form} style={{ width }}>
        <SubjectSelect
          label='Subjects'
          onSelectedChange={onSubjectsChange}
          selected={query.subjects}
          className={styles.field}
          renderToPortal
          outlined
        />
        <UserSelect
          label='People'
          onSelectedChange={onPeopleChange}
          selected={query.people}
          className={styles.field}
          renderToPortal
          outlined
        />
      </form>
    </animated.div>
  );
}

export default memo(FiltersSheet);
