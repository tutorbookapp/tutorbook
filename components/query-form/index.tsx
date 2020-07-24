import { useIntl, IntlHelper, IntlShape, Msg } from 'lib/intl';
import { Option, Availability, Query, Callback } from 'lib/model';

import React from 'react';
import LangSelect from 'components/lang-select';
import ScheduleInput from 'components/schedule-input';
import SubjectSelect from 'components/subject-select';

import msgs from './msgs';
import styles from './query-form.module.scss';

type FocusTarget = 'subjects' | 'availability' | 'langs';
type QueryFormInputConfig = { [key in FocusTarget]?: boolean };

interface QueryFormProps {
  query: Query;
  onChange: Callback<Query>;
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
  const intl: IntlShape = useIntl();
  const msg: IntlHelper = (message: Msg) => intl.formatMessage(message);
  const [focused, setFocused] = React.useState<FocusTarget | undefined>(
    focusTarget
  );

  const onSubjectsChange = React.useCallback(
    (s: Option<string>[]) => {
      onChange(new Query({ ...query, subjects: s }));
    },
    [onChange, query]
  );
  const onLangsChange = React.useCallback(
    (l: Option<string>[]) => {
      onChange(new Query({ ...query, langs: l }));
    },
    [onChange, query]
  );
  const onAvailabilityChange = React.useCallback(
    (a: Availability) => {
      onChange(new Query({ ...query, availability: a }));
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
          label={msg(msgs.subjects)}
          onFocused={focusSubjects}
          onBlurred={focusNothing}
          className={className}
          renderToPortal
          outlined
          onSelectedChange={onSubjectsChange}
          selected={query.subjects}
          placeholder={msg(msgs[`${query.aspect}SubjectsPlaceholder`])}
          aspect={query.aspect}
        />
      )}
      {availability && (
        <ScheduleInput
          focused={focused === 'availability'}
          label={msg(msgs.availability)}
          onFocused={focusAvailability}
          onBlurred={focusNothing}
          className={className}
          renderToPortal
          outlined
          onChange={onAvailabilityChange}
          value={query.availability}
        />
      )}
      {langs && (
        <LangSelect
          focused={focused === 'langs'}
          label={msg(msgs.langs)}
          onFocused={focusLangs}
          onBlurred={focusNothing}
          className={className}
          renderToPortal
          outlined
          onSelectedChange={onLangsChange}
          selected={query.langs}
        />
      )}
    </>
  );
}
