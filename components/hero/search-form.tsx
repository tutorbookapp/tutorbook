import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Router from 'next/router';
import useTranslation from 'next-translate/useTranslation';

import Button from 'components/button';
import { QueryInputs } from 'components/inputs';

import { Aspect, UsersQuery } from 'lib/model';
import { useUser } from 'lib/account';

import styles from './search-form.module.scss';

interface SearchFormProps {
  aspect: Aspect;
}

export default function SearchForm({ aspect }: SearchFormProps): JSX.Element {
  const { t } = useTranslation();
  const { user } = useUser();

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [query, setQuery] = useState<UsersQuery>(
    new UsersQuery({
      aspect: aspect || 'mentoring',
      langs: [],
      subjects: [],
    })
  );

  const url = useMemo(() => {
    return query.getURL(`/${user.orgs[0] || 'default'}/search`);
  }, [query, user.orgs]);

  useEffect(() => {
    setQuery((prev: UsersQuery) => {
      if (!aspect || aspect === prev.aspect) return prev;
      return new UsersQuery({ ...prev, aspect });
    });
  }, [aspect]);

  useEffect(() => {
    void Router.prefetch('/[org]/search/[[...slug]]', url);
  }, [url]);

  const handleSubmit = useCallback(
    async (evt: FormEvent<HTMLFormElement>) => {
      evt.preventDefault();
      setSubmitting(true);
      await Router.push('/[org]/search/[[...slug]]', url);
    },
    [url]
  );
  const onChange = useCallback((qry: UsersQuery) => setQuery(qry), []);

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <QueryInputs
        subjects
        thirdPerson
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
