import { Card } from '@rmwc/card';
import { defMsg, useIntl, IntlHelper, IntlShape, Msg } from '@tutorbook/intl';

import React from 'react';
import SubjectSelect from '@tutorbook/subject-select';
import Button from '@tutorbook/button';
import FormProps from './form-props';

import styles from './query-form.module.scss';

const msgs: Record<string, Msg> = defMsg({
  btn: { id: 'query-form.mentoring.btn', defaultMessage: 'Search mentors' },
  subjects: {
    id: 'query-form.mentoring.subjects-label',
    defaultMessage: 'What would you like to learn?',
  },
  subjectsPlaceholder: {
    id: 'query-form.mentoring.subjects-placeholder',
    defaultMessage: 'Ex. Computer Science or Photography',
  },
});

export default function MentorsForm({
  query,
  button,
  visible,
  onSubmit,
  onChange,
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
      <form
        className={styles.form + (!button ? ' ' + styles.noButton : '')}
        onSubmit={handleSubmit}
      >
        <SubjectSelect
          val={query.subjects}
          className={styles.field}
          label={msg(msgs.subjects)}
          placeholder={msg(msgs.subjectsPlaceholder)}
          onChange={(subjects: string[]) => onChange({ ...query, subjects })}
          searchIndex='expertise'
          outlined
        />
        {button && (
          <Button
            className={styles.btn}
            label={msg(msgs.btn)}
            disabled={submitting}
            raised
            arrow
          />
        )}
      </form>
    </Card>
  );
}
