import { useIntl, IntlShape } from '@tutorbook/intl';
import { Query } from '@tutorbook/model';

import Router from 'next/router';
import TutorsForm from './tutors-form';
import MentorsForm from './mentors-form';

import url from 'url';

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

export default function QueryForm({ query }: { query: Query }): JSX.Element {
  const intl: IntlShape = useIntl();
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    Router.push(`/${intl.locale}${getSearchURL(query)}`);
    return false;
  };
  return (
    <>
      <TutorsForm
        query={query}
        visible={query.aspect === 'tutoring'}
        onSubmit={handleSubmit}
      />
      <MentorsForm
        query={query}
        visible={query.aspect === 'mentoring'}
        onSubmit={handleSubmit}
      />
    </>
  );
}
