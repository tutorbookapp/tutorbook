import { animated, useSpring } from 'react-spring';
import { memo, useCallback, useMemo } from 'react';
import { dequal } from 'dequal/lite';

import SubjectSelect from 'components/subject-select';
import TagSelect from 'components/tag-select';
import UserSelect from 'components/user-select';

import { DBMeetingTag, MEETING_TAGS } from 'lib/model/meeting';
import { Callback } from 'lib/model/callback';
import { MeetingsQuery } from 'lib/model/query/meetings';
import { Subject } from 'lib/model/subject';
import { useOrg } from 'lib/context/org';

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
    (subjects: Subject[]) => {
      setQuery((prev) => new MeetingsQuery({ ...prev, subjects, page: 0 }));
    },
    [setQuery]
  );
  const onPeopleChange = useCallback(
    (people: string[]) => {
      setQuery((prev) => new MeetingsQuery({ ...prev, people, page: 0 }));
    },
    [setQuery]
  );
  const onTagsChange = useCallback(
    (tags: DBMeetingTag[]) => {
      setQuery((prev) => new MeetingsQuery({ ...prev, tags, page: 0 }));
    },
    [setQuery]
  );

  const { org } = useOrg();
  const peopleQuery = useMemo(() => ({ orgs: [org?.id || 'default'] }), [org]);

  return (
    <animated.div
      data-cy='filters-sheet'
      className={styles.wrapper}
      style={props}
    >
      <form className={styles.form} style={{ width }}>
        <SubjectSelect
          label='Subjects'
          onChange={onSubjectsChange}
          value={query.subjects}
          className={styles.field}
          renderToPortal
          outlined
        />
        <UserSelect
          label='People'
          query={peopleQuery}
          onChange={onPeopleChange}
          value={query.people}
          className={styles.field}
          renderToPortal
          outlined
        />
        <TagSelect
          label='Tags'
          placeholder='Ex: Recurring'
          onChange={onTagsChange}
          value={query.tags}
          className={styles.field}
          options={MEETING_TAGS}
          renderToPortal
          outlined
        />
      </form>
    </animated.div>
  );
}

export default memo(FiltersSheet, dequal);
