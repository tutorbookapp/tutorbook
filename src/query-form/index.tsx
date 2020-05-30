import { Availability, Aspect, Query } from '@tutorbook/model';

import React from 'react';
import TutorsForm from './tutors-form';
import MentorsForm from './mentors-form';

interface QueryFormProps {
  query?: Query;
  aspect?: Aspect;
  onChange?: (query: Query) => any;
  onSubmit?: (query: Query) => any;
}

export default function QueryForm({
  query,
  aspect,
  onChange,
  onSubmit,
}: QueryFormProps): JSX.Element {
  const [qry, setQuery] = React.useState<Query>(
    query || {
      aspect: aspect || 'mentoring',
      subjects: [],
      availability: new Availability(),
    }
  );

  if (query && query !== qry) setQuery(query);
  if (aspect && aspect !== qry.aspect) setQuery({ ...qry, aspect });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (onSubmit) onSubmit(qry);
    return false;
  };
  const handleChange = (query: Query) => {
    setQuery(query);
    if (onChange) onChange(query);
  };

  return (
    <>
      <TutorsForm
        query={qry}
        button={!!onSubmit}
        visible={qry.aspect === 'tutoring'}
        onSubmit={handleSubmit}
        onChange={handleChange}
      />
      <MentorsForm
        query={qry}
        button={!!onSubmit}
        visible={qry.aspect === 'mentoring'}
        onSubmit={handleSubmit}
        onChange={handleChange}
      />
    </>
  );
}
