import { useIntl, IntlHelper, IntlShape, Msg } from '@tutorbook/intl';
import { Aspect, Query, Availability } from '@tutorbook/model';

import React from 'react';
import ScheduleInput from '@tutorbook/schedule-input';
import SubjectSelect from '@tutorbook/subject-select';
import Button from '@tutorbook/button';

import msgs from './msgs';
import styles from './query-form.module.scss';

interface QueryFormProps {
  query?: Query;
  aspect?: Aspect;
  onChange?: (query: Query) => any;
  onSubmit?: (query: Query) => any;
}

export default function QueryForm({
  query,
  aspect,
  onChange,
  onSubmit,
}: QueryFormProps): JSX.Element {
  const intl: IntlShape = useIntl();
  const msg: IntlHelper = (msg: Msg) => intl.formatMessage(msg);
  const className: string =
    styles.form + (!onSubmit ? ' ' + styles.noButton : '');

  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const [qry, setQuery] = React.useState<Query>(
    query || {
      aspect: aspect || 'mentoring',
      subjects: [],
      availability: new Availability(),
    }
  );

  React.useEffect(() => {
    if (query && query !== qry) setQuery(query);
    if (aspect && aspect !== qry.aspect) setQuery({ ...qry, aspect });
  }, [query, aspect]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setSubmitting(true);
    if (onSubmit) onSubmit(qry);
    return false;
  };
  const handleChange = (query: Query) => {
    setQuery(query);
    if (onChange) onChange(query);
  };

  return (
    <form className={className} onSubmit={handleSubmit}>
      <SubjectSelect
        val={qry.subjects}
        className={styles.field}
        label={msg(msgs.subjects)}
        placeholder={msg(msgs[qry.aspect + 'SubjectsPlaceholder'])}
        onChange={(subjects: string[]) => handleChange({ ...qry, subjects })}
        aspect={qry.aspect}
        outlined
      />
      {qry.aspect === 'tutoring' && (
        <ScheduleInput
          val={qry.availability}
          className={styles.field}
          label={msg(msgs.availability)}
          onChange={(availability: Availability) =>
            handleChange({ ...qry, availability })
          }
          outlined
        />
      )}
      {!!onSubmit && (
        <Button
          className={styles.btn}
          label={msg(msgs[qry.aspect + 'Btn'])}
          disabled={submitting}
          raised
          arrow
        />
      )}
    </form>
  );
}
