import { useIntl, defMsg, IntlHelper, IntlShape, Msg } from '@tutorbook/intl';
import { Aspect, Query, Availability } from '@tutorbook/model';

import React from 'react';
import Router from 'next/router';
import Button from '@tutorbook/button';
import QueryForm from '@tutorbook/query-form';

import styles from './search-form.module.scss';

interface SearchFormProps {
  aspect: Aspect;
}

const msgs: Record<string, Msg> = defMsg({
  mentoringBtn: {
    id: 'search-form.mentoring.btn',
    defaultMessage: 'Search mentors',
  },
  tutoringBtn: {
    id: 'search-form.tutoring.btn',
    defaultMessage: 'Search tutors',
  },
});

export default function SearchForm({ aspect }: SearchFormProps): JSX.Element {
  const intl: IntlShape = useIntl();
  const msg: IntlHelper = (message: Msg) => intl.formatMessage(message);

  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const [query, setQuery] = React.useState<Query>(
    new Query({
      aspect: aspect || 'mentoring',
      langs: [], // TODO: Pre-fill with current locale language.
      subjects: [],
      availability: new Availability(),
    })
  );

  React.useEffect(
    () =>
      setQuery((oldQuery: Query) => {
        if (aspect && aspect !== oldQuery.aspect)
          return new Query({ ...oldQuery, aspect });
        return oldQuery;
      }),
    [aspect]
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setSubmitting(true);
    // TODO: Show an intermediate loader above the top app bar as we redirect.
    await Router.push(
      '/[locale]/search/[[...slug]]',
      `/${intl.locale}${query.url}`
    );
    return false;
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <QueryForm
        subjects
        availability={query.aspect === 'tutoring'}
        onChange={(newQuery: Query) => setQuery(newQuery)}
        query={query}
      />
      <Button
        className={styles.button}
        label={msg(msgs[`${query.aspect}Btn`])}
        disabled={submitting}
        raised
        arrow
      />
    </form>
  );
}
