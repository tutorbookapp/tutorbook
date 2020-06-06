import React from 'react';

import { useIntl, defMsg, IntlShape, Msg } from '@tutorbook/intl';
import { Timeslot, User, Query } from '@tutorbook/model';

import Carousel from '@tutorbook/carousel';
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
  readonly user?: User;
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

export default function Search({
  user,
  query,
  results,
  searching,
  onChange,
}: SearchProps): JSX.Element {
  const intl: IntlShape = useIntl();
  const [viewing, setViewing] = React.useState<User | undefined>(user);
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
            Utils.intersection<Timeslot>(
              query.availability,
              viewing.availability,
              (a: Timeslot, b: Timeslot) => a.equalTo(b)
            )[0]
          }
        />
      )}
      <div className={styles.title}>
        <Title>{intl.formatMessage(msgs[query.aspect])}</Title>
      </div>
      <Form query={query} onChange={onChange} />
      {searching && !results.length && (
        <ul className={styles.results}>
          {Array(5)
            .fill(null)
            .map((_: null, index: number) => (
              <Result loading key={index} />
            ))}
        </ul>
      )}
      {!!results.length && (
        <ul className={styles.results}>
          {results.map((res: User, index: number) => (
            <Result
              user={res}
              key={res.uid || index}
              onClick={() => setViewing(res)}
            />
          ))}
        </ul>
      )}
      {!searching && !results.length && (
        <div className={styles.noResults}>
          <h3 className={styles.noResultsHeader}>No Results</h3>
          <p className={styles.noResultsBody}>
            We couldn't find anyone matching those filters. But here are some
            suggestions:
          </p>
          <Carousel aspect={query.aspect} onClick={setViewing} />
        </div>
      )}
    </div>
  );
}
