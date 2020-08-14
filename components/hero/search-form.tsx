import { FormEvent, useCallback, useEffect, useState } from 'react';
import Router from 'next/router';
import useTranslation from 'next-translate/useTranslation';

import Button from 'components/button';
import { QueryInputs } from 'components/inputs';

import { Aspect, Availability, UsersQuery } from 'lib/model';

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
    async (event: FormEvent<HTMLFormElement>) => {
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
        thirdPerson
        availability={query.aspect === 'tutoring'}
        className={styles.field}
        onChange={onChange}
        value={query}
      />
      <Button
        className={styles.btn}
        label={t(`query3rd:${query.aspect}-btn`)}
        disabled={submitting}
        raised
        arrow
      />
    </form>
  );
}
