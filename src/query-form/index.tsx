import { useIntl, IntlHelper, IntlShape, Msg } from '@tutorbook/intl';
import { Option, Availability, Query, Callback } from '@tutorbook/model';

import React from 'react';
import LangSelect from '@tutorbook/lang-select';
import ScheduleInput from '@tutorbook/schedule-input';
import SubjectSelect from '@tutorbook/subject-select';

import msgs from './msgs';
import styles from './query-form.module.scss';

interface QueryFormProps {
  query: Query;
  onChange: Callback<Query>;
  vertical?: boolean;
  subjects?: boolean;
  availability?: boolean;
  langs?: boolean;
  orgs?: boolean;
  focusTarget?: FocusTarget;
}

type FocusTarget = 'subjects' | 'availability' | 'langs' | 'orgs';

export default function QueryForm({
  query,
  onChange,
  vertical,
  subjects,
  availability,
  langs,
  orgs,
  focusTarget,
}: QueryFormProps): JSX.Element {
  const intl: IntlShape = useIntl();
  const msg: IntlHelper = (message: Msg) => intl.formatMessage(message);
  const [focused, setFocused] = React.useState<FocusTarget | undefined>(
    focusTarget
  );
  const className: string = vertical ? styles.vertField : styles.horzField;

  React.useEffect(() => setFocused(focusTarget), [focusTarget]);

  return (
    <>
      {subjects && (
        <SubjectSelect
          value={query.subjects}
          onChange={(newSubjects: Option<string>[]) =>
            onChange(new Query({ ...query, subjects: newSubjects }))
          }
          className={className}
          label={msg(msgs.subjects)}
          placeholder={msg(msgs[`${query.aspect}SubjectsPlaceholder`])}
          aspect={query.aspect}
          renderToPortal
          focused={focused === 'subjects'}
          onFocused={() => setFocused('subjects')}
          onBlurred={() => setFocused(undefined)}
        />
      )}
      {availability && (
        <ScheduleInput
          value={query.availability}
          onChange={(newAvailability: Availability) =>
            onChange(new Query({ ...query, availability: newAvailability }))
          }
          className={className}
          label={msg(msgs.availability)}
          renderToPortal
          focused={focused === 'availability'}
          onFocused={() => setFocused('availability')}
          onBlurred={() => setFocused(undefined)}
        />
      )}
      {langs && (
        <LangSelect
          value={query.langs}
          onChange={(newLangs: Option<string>[]) =>
            onChange(new Query({ ...query, langs: newLangs }))
          }
          className={className}
          label={msg(msgs.langs)}
          renderToPortal
          focused={focused === 'langs'}
          onFocused={() => setFocused('langs')}
          onBlurred={() => setFocused(undefined)}
        />
      )}
    </>
  );
}
