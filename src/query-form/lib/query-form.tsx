import { Query } from '@tutorbook/model';

import React from 'react';
import TutorsForm from './tutors-form';
import MentorsForm from './mentors-form';

interface QueryFormProps {
  query: Query;
  onChange: (query: Query) => any;
  onSubmit?: (query: Query) => any;
}

export default function QueryForm({
  query,
  onChange,
  onSubmit,
}: QueryFormProps): JSX.Element {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (onSubmit) onSubmit(query);
    return false;
  };
  return (
    <>
      <TutorsForm
        query={query}
        button={!!onSubmit}
        visible={query.aspect === 'tutoring'}
        onSubmit={handleSubmit}
        onChange={onChange}
      />
      <MentorsForm
        query={query}
        button={!!onSubmit}
        visible={query.aspect === 'mentoring'}
        onSubmit={handleSubmit}
        onChange={onChange}
      />
    </>
  );
}
