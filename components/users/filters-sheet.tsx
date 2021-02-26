import { animated, useSpring } from 'react-spring';
import { memo, useCallback } from 'react';
import { Checkbox } from '@rmwc/checkbox';
import useTranslation from 'next-translate/useTranslation';

import LangSelect from 'components/lang-select';
import SubjectSelect from 'components/subject-select';

import { Callback, Option, UsersQuery } from 'lib/model';

import { config, width } from './spring-animation';
import styles from './filters-sheet.module.scss';
import { toggleTag } from './utils';

export interface FiltersSheetProps {
  query: UsersQuery;
  setQuery: Callback<UsersQuery>;
  open: boolean;
}

function FiltersSheet({
  query,
  setQuery,
  open,
}: FiltersSheetProps): JSX.Element {
  const props = useSpring({ config, width: open ? width : 0 });

  const { t } = useTranslation();

  const onSubjectsChange = useCallback(
    (subjects: Option<string>[]) => {
      setQuery((prev) => new UsersQuery({ ...prev, subjects, page: 0 }));
    },
    [setQuery]
  );
  const onLangsChange = useCallback(
    (langs: Option<string>[]) => {
      setQuery((prev) => new UsersQuery({ ...prev, langs, page: 0 }));
    },
    [setQuery]
  );

  return (
    <animated.div className={styles.wrapper} style={props}>
      <form className={styles.form} style={{ width }}>
        <h6>{t('users:filters')}</h6>
        <SubjectSelect
          label={t('query:subjects')}
          onSelectedChange={onSubjectsChange}
          selected={query.subjects}
          placeholder={t(`common:${query.aspect}-subjects-placeholder`)}
          aspect={query.aspect}
          className={styles.field}
          renderToPortal
          outlined
        />
        <LangSelect
          label={t('query:langs')}
          placeholder={t('common:langs-placeholder')}
          onSelectedChange={onLangsChange}
          selected={query.langs}
          className={styles.field}
          renderToPortal
          outlined
        />
        <h6>{t('users:roles')}</h6>
        <Checkbox
          className={styles.checkbox}
          label={t('common:mentors')}
          onChange={() => {
            setQuery((prev) => {
              const tags = toggleTag(prev.tags, 'mentor');
              return new UsersQuery({ ...prev, tags, page: 0 });
            });
          }}
          checked={query.tags.includes('mentor')}
        />
        <Checkbox
          className={styles.checkbox}
          label={t('common:mentees')}
          onChange={() => {
            setQuery((prev) => {
              const tags = toggleTag(prev.tags, 'mentee');
              return new UsersQuery({ ...prev, tags, page: 0 });
            });
          }}
          checked={query.tags.includes('mentee')}
        />
        <Checkbox
          className={styles.checkbox}
          label={t('common:tutors')}
          onChange={() => {
            setQuery((prev) => {
              const tags = toggleTag(prev.tags, 'tutor');
              return new UsersQuery({ ...prev, tags, page: 0 });
            });
          }}
          checked={query.tags.includes('tutor')}
        />
        <Checkbox
          className={styles.checkbox}
          label={t('common:tutees')}
          onChange={() => {
            setQuery((prev) => {
              const tags = toggleTag(prev.tags, 'tutee');
              return new UsersQuery({ ...prev, tags, page: 0 });
            });
          }}
          checked={query.tags.includes('tutee')}
        />
      </form>
    </animated.div>
  );
}

export default memo(FiltersSheet);
