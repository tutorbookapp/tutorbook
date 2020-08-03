import { Aspect, UsersQuery, Availability } from 'lib/model';

import React, { useState, useEffect, useCallback } from 'react';
import Router from 'next/router';
import Button from 'components/button';
import QueryForm from 'components/query-form';

import useTranslation from 'next-translate/useTranslation';
import styles from './search-form.module.scss';

interface SearchFormProps {
  aspect: Aspect;
}

export default function SearchForm({ aspect }: SearchFormProps): JSX.Element {
  const { t, lang: locale } = useTranslation();

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [query, setQuery] = useState<UsersQuery>(
    new UsersQuery({
      aspect: aspect || 'mentoring',
      langs: [], // TODO: Pre-fill with current locale language.
      subjects: [],
      availability: new Availability(),
    })
  );

  useEffect(() => {
    setQuery((prev: UsersQuery) => {
      if (!aspect || aspect === prev.aspect) return prev;
      return new UsersQuery({ ...prev, aspect });
    });
  }, [aspect]);

  useEffect(() => {
    void Router.prefetch('/search/[[...slug]]', query.url);
  }, [query, locale]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setSubmitting(true);
      await Router.push('/search/[[...slug]]', query.url);
    },
    [query, locale]
  );
  const onChange = useCallback((qry: UsersQuery) => setQuery(qry), []);

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
        label={t(`about:search-${query.aspect}-btn`)}
        disabled={submitting}
        raised
        arrow
      />
    </form>
  );
}
