import { animated, useSpring } from 'react-spring';
import { memo, useCallback } from 'react';
import useTranslation from 'next-translate/useTranslation';

import LangSelect from 'components/lang-select';
import SubjectSelect from 'components/subject-select';

import { Callback, Option, UsersQuery } from 'lib/model';

import { config, width } from './spring-animation';
import styles from './filters-sheet.module.scss';

export interface FiltersSheetProps {
  query: UsersQuery;
  setQuery: Callback<UsersQuery>;
  open: boolean;
}

export default memo(function FiltersSheet({
  query,
  setQuery,
  open,
}: FiltersSheetProps): JSX.Element {
  const props = useSpring({ config, width: open ? width : 0 });

  const { t } = useTranslation();

  const onSubjectsChange = useCallback(
    (subjects: Option<string>[]) => {
      setQuery((prev) => new UsersQuery({ ...prev, subjects }));
    },
    [setQuery]
  );
  const onLangsChange = useCallback(
    (langs: Option<string>[]) => {
      setQuery((prev) => new UsersQuery({ ...prev, langs }));
    },
    [setQuery]
  );

  return (
    <animated.div className={styles.wrapper} style={props}>
      <div className={styles.content} style={{ width }}>
        <h4 className={styles.header}>More filters</h4>
        <form className={styles.form}>
          <SubjectSelect
            label={t('query:subjects')}
            onSelectedChange={onSubjectsChange}
            selected={query.subjects}
            placeholder={t(`common:${query.aspect}-subjects-placeholder`)}
            aspect={query.aspect}
            className={styles.field}
            outlined
          />
          <LangSelect
            label={t('query:langs')}
            placeholder={t('common:langs-placeholder')}
            onSelectedChange={onLangsChange}
            selected={query.langs}
            className={styles.field}
            outlined
          />
        </form>
      </div>
    </animated.div>
  );
});
