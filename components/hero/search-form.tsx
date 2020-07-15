import { useIntl, useMsg, defMsg, IntlHelper, Msg } from 'lib/intl';
import { Aspect, Query, Availability } from 'lib/model';

import React from 'react';
import Router from 'next/router';
import Button from 'components/button';
import QueryForm from 'components/query-form';

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
  const { locale } = useIntl();
  const msg: IntlHelper = useMsg();

  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const [query, setQuery] = React.useState<Query>(
    new Query({
      aspect: aspect || 'mentoring',
      langs: [], // TODO: Pre-fill with current locale language.
      subjects: [],
      availability: new Availability(),
    })
  );

  React.useEffect(() => {
    setQuery((prev: Query) => {
      if (!aspect || aspect === prev.aspect) return prev;
      return new Query({ ...prev, aspect });
    });
  }, [aspect]);

  React.useEffect(() => {
    void Router.prefetch(
      '/[locale]/search/[[...slug]]',
      `/${locale}${query.url}`
    );
  }, [query, locale]);

  const handleSubmit = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setSubmitting(true);
      await Router.push(
        '/[locale]/search/[[...slug]]',
        `/${locale}${query.url}`
      );
    },
    [query, locale]
  );
  const onChange = React.useCallback((qry: Query) => setQuery(qry), []);

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <QueryForm
        subjects
        availability={query.aspect === 'tutoring'}
        onChange={onChange}
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
