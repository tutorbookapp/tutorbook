import { Option, Availability, UsersQuery, Callback } from 'lib/model';

import React from 'react';
import LangSelect from 'components/lang-select';
import TimesSelect from 'components/times-select';
import SubjectSelect from 'components/subject-select';

import useTranslation from 'next-translate/useTranslation';
import styles from './query-form.module.scss';

type FocusTarget = 'subjects' | 'availability' | 'langs';
type QueryFormInputConfig = { [key in FocusTarget]?: boolean };

interface QueryFormProps {
  query: UsersQuery;
  onChange: Callback<UsersQuery>;
  vertical?: boolean;
  focusTarget?: FocusTarget;
}

export default function QueryForm({
  query,
  onChange,
  vertical,
  focusTarget,
  subjects,
  availability,
  langs,
}: QueryFormProps & QueryFormInputConfig): JSX.Element {
  const { t } = useTranslation();
  const [focused, setFocused] = React.useState<FocusTarget | undefined>(
    focusTarget
  );

  const onSubjectsChange = React.useCallback(
    (s: Option<string>[]) => {
      onChange(new UsersQuery({ ...query, subjects: s }));
    },
    [onChange, query]
  );
  const onLangsChange = React.useCallback(
    (l: Option<string>[]) => {
      onChange(new UsersQuery({ ...query, langs: l }));
    },
    [onChange, query]
  );
  const onAvailabilityChange = React.useCallback(
    (a: Availability) => {
      onChange(new UsersQuery({ ...query, availability: a }));
    },
    [onChange, query]
  );

  const focusSubjects = React.useCallback(() => setFocused('subjects'), []);
  const focusLangs = React.useCallback(() => setFocused('langs'), []);
  const focusAvailability = React.useCallback(
    () => setFocused('availability'),
    []
  );
  const focusNothing = React.useCallback(() => setFocused(undefined), []);

  const className = React.useMemo(
    () => (vertical ? styles.vertField : styles.horzField),
    [vertical]
  );

  React.useEffect(() => setFocused(focusTarget), [focusTarget]);

  return (
    <>
      {subjects && (
        <SubjectSelect
          focused={focused === 'subjects'}
          label={t('query:subjects')}
          onFocused={focusSubjects}
          onBlurred={focusNothing}
          className={className}
          onSelectedChange={onSubjectsChange}
          selected={query.subjects}
          placeholder={t(`query:subjects-${query.aspect}-placeholder`)}
          aspect={query.aspect}
          outlined
        />
      )}
      {availability && (
        <TimesSelect
          focused={focused === 'availability'}
          label={t('query:availability')}
          onFocused={focusAvailability}
          onBlurred={focusNothing}
          className={className}
          onChange={onAvailabilityChange}
          value={query.availability}
          outlined
        />
      )}
      {langs && (
        <LangSelect
          focused={focused === 'langs'}
          label={t('query:langs')}
          onFocused={focusLangs}
          onBlurred={focusNothing}
          className={className}
          onSelectedChange={onLangsChange}
          selected={query.langs}
          outlined
        />
      )}
    </>
  );
}
