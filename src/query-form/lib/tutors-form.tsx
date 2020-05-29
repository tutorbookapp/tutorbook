import { Card } from '@rmwc/card';
import { defMsg, useIntl, IntlHelper, IntlShape, Msg } from '@tutorbook/intl';

import React from 'react';
import ScheduleInput from '@tutorbook/schedule-input';
import SubjectSelect from '@tutorbook/subject-select';
import Button from '@tutorbook/button';
import FormProps from './form-props';

import styles from './query-form.module.scss';

const msgs: Record<string, Msg> = defMsg({
  btn: { id: 'query-form.tutoring.btn', defaultMessage: 'Search tutors' },
  subjects: {
    id: 'query-form.tutoring.subjects-label',
    defaultMessage: 'What would you like to learn?',
  },
  subjectsPlaceholder: {
    id: 'query-form.tutoring.subjects-placeholder',
    defaultMessage: 'Ex. Algebra or Biology',
  },
  availability: {
    id: 'query-form.tutoring.availability-label',
    defaultMessage: 'When are you available?',
  },
});

export default function TutorsForm({
  visible,
  query,
  onSubmit,
}: FormProps): JSX.Element {
  const intl: IntlShape = useIntl();
  const msg: IntlHelper = (msg: Msg) => intl.formatMessage(msg);
  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    setSubmitting(true);
    return onSubmit(event);
  };
  return (
    <Card className={styles.card + (!visible ? ' ' + styles.hidden : '')}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <SubjectSelect
          val={query.subjects}
          className={styles.field}
          label={msg(msgs.subjects)}
          placeholder={msg(msgs.subjectsPlaceholder)}
          outlined
        />
        <ScheduleInput
          val={query.availability}
          className={styles.field}
          label={msg(msgs.availability)}
          outlined
        />
        <Button
          className={styles.btn}
          label={msg(msgs.btn)}
          disabled={submitting}
          raised
          arrow
        />
      </form>
    </Card>
  );
}
