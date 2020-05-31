import React from 'react';

import { useIntl, defMsg, IntlShape, Msg } from '@tutorbook/intl';
import { Timeslot, User, Query } from '@tutorbook/model';

import UserDialog from '@tutorbook/user-dialog';
import Utils from '@tutorbook/utils';
import Title from '@tutorbook/title';
import Result from './result';
import Form from './form';

import styles from './search.module.scss';

interface SearchProps {
  readonly onChange: (query: Query) => any;
  readonly results: ReadonlyArray<User>;
  readonly searching: boolean;
  readonly query: Query;
}

const msgs: Record<string, Msg> = defMsg({
  mentoring: {
    id: 'search.mentoring.title',
    defaultMessage: 'Expert mentors',
  },
  tutoring: {
    id: 'search.tutoring.title',
    defaultMessage: 'Volunteer tutors',
  },
});

function NoResults({
  header,
  body,
}: {
  header: string;
  body?: string;
}): JSX.Element {
  return (
    <div className={styles.noResults}>
      <h3 className={styles.noResultsHeader}>{header}</h3>
      {body && <p className={styles.noResultsBody}>{body}</p>}
    </div>
  );
}

export default function Search({
  query,
  results,
  searching,
  onChange,
}: SearchProps): JSX.Element {
  const intl: IntlShape = useIntl();
  const [viewing, setViewing] = React.useState<User | undefined>();
  return (
    <div className={styles.wrapper}>
      {viewing && (
        <UserDialog
          user={viewing}
          aspect={query.aspect}
          onClosed={() => setViewing(undefined)}
          subjects={Utils.intersection<string>(
            query.subjects,
            viewing[query.aspect].subjects
          )}
          time={
            query.aspect === 'tutoring'
              ? Utils.intersection<Timeslot>(
                  query.availability,
                  viewing.availability,
                  (a: Timeslot, b: Timeslot) => a.equalTo(b)
                )[0]
              : undefined
          }
        />
      )}
      <div className={styles.title}>
        <Title>{intl.formatMessage(msgs[query.aspect])}</Title>
      </div>
      <Form query={query} onChange={onChange} />
      {searching && !results.length && (
        <NoResults
          header='Searching...'
          body='Fetching your stellar search results...'
        />
      )}
      {!!results.length && (
        <ul className={styles.results}>
          {results.map((res: User, index: number) => (
            <Result user={res} key={index} onClick={() => setViewing(res)} />
          ))}
        </ul>
      )}
      {!searching && !results.length && (
        <NoResults
          header='No Results'
          body='Try adding more availability or subjects.'
        />
      )}
    </div>
  );
}
