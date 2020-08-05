import { Aspect, UsersQuery, Availability } from 'lib/model';
import { QueryInputs } from 'components/inputs';

import React, { useState, useEffect, useCallback } from 'react';
import Router from 'next/router';
import Button from 'components/button';

import useTranslation from 'next-translate/useTranslation';
import styles from './search-form.module.scss';

interface SearchFormProps {
  aspect: Aspect;
}

export default function SearchForm({ aspect }: SearchFormProps): JSX.Element {
  const { t } = useTranslation();

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [query, setQuery] = useState<UsersQuery>(
    new UsersQuery({
      aspect: aspect || 'mentoring',
      langs: [],
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
  }, [query]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setSubmitting(true);
      await Router.push('/search/[[...slug]]', query.url);
    },
    [query]
  );
  const onChange = useCallback((qry: UsersQuery) => setQuery(qry), []);

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <QueryInputs
        subjects
        availability={query.aspect === 'tutoring'}
        className={styles.field}
        onChange={onChange}
        value={query}
      />
      <Button
        className={styles.btn}
        label={t(`about:search-${query.aspect}-btn`)}
        disabled={submitting}
        raised
        arrow
      />
    </form>
  );
}
