import { useIntl, defMsg, IntlHelper, IntlShape, Msg } from '@tutorbook/intl';
import { Aspect, Query, Availability } from '@tutorbook/model';

import React from 'react';
import Router from 'next/router';
import Button from '@tutorbook/button';
import QueryForm from '@tutorbook/query-form';

import url from 'url';
import styles from './search-form.module.scss';

interface SearchFormProps {
  aspect: Aspect;
}

function getSearchURL(query: Query): string {
  return url.format({
    pathname: '/search',
    query: {
      aspect: encodeURIComponent(query.aspect),
      subjects: encodeURIComponent(JSON.stringify(query.subjects)),
      availability: query.availability.toURLParam(),
    },
  });
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
  const msg: IntlHelper = (msg: Msg) => intl.formatMessage(msg);

  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const [query, setQuery] = React.useState<Query>({
    aspect: aspect || 'mentoring',
    langs: [], // TODO: Pre-fill with current locale language.
    subjects: [],
    availability: new Availability(),
  });

  React.useEffect(() => {
    if (aspect && aspect !== query.aspect) setQuery({ ...query, aspect });
  }, [aspect]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setSubmitting(true);
    Router.push(`/${intl.locale}${getSearchURL(query)}`);
    return false;
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <QueryForm
        subjects
        availability={query.aspect === 'tutoring'}
        onChange={(query: Query) => setQuery(query)}
        query={query}
      />
      <Button
        className={styles.button}
        label={msg(msgs[query.aspect + 'Btn'])}
        disabled={submitting}
        raised
        arrow
      />
    </form>
  );
}
