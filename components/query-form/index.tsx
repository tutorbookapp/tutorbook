import { useIntl, IntlHelper, IntlShape, Msg } from 'lib/intl';
import { Query, QueryInterface, Callback } from 'lib/model';

import React from 'react';
import LangSelect from 'components/lang-select';
import CheckSelect from 'components/check-select';
import ScheduleInput from 'components/schedule-input';
import SubjectSelect from 'components/subject-select';

import msgs from './msgs';
import styles from './query-form.module.scss';

type FocusTarget = keyof QueryInterface;

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
  orgs,
  checks,
}: QueryFormProps & QueryFormInputConfig): JSX.Element {
  const intl: IntlShape = useIntl();
  const msg: IntlHelper = (message: Msg) => intl.formatMessage(message);
  const [focused, setFocused] = React.useState<FocusTarget | undefined>(
    focusTarget
  );

  function props<T extends QueryInterface[FocusTarget]>(id: FocusTarget) {
    return {
      className: vertical ? styles.vertField : styles.horzField,
      focused: focused === id,
      onFocused: () => setFocused(id),
      onBlurred: () => setFocused(undefined),
      renderToPortal: true,
      label: msg(msgs[id]),
      value: query[id] as T,
      onChange: (value: T) => onChange(new Query({ ...query, [id]: value })),
    };
  }

  React.useEffect(() => setFocused(focusTarget), [focusTarget]);

  return (
    <>
      {subjects && (
        <SubjectSelect
          {...props('subjects')}
          placeholder={msg(msgs[`${query.aspect}SubjectsPlaceholder`])}
          aspect={query.aspect}
        />
      )}
      {availability && <ScheduleInput {...props('availability')} />}
      {langs && <LangSelect {...props('langs')} />}
      {checks && <CheckSelect {...props('checks')} autoOpenMenu />}
    </>
  );
}
