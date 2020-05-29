import React from 'react';

import { useUser } from '@tutorbook/firebase';
import { useIntl, defMsg, IntlShape, Msg } from '@tutorbook/intl';
import {
  Appt,
  AttendeeInterface,
  Timeslot,
  User,
  Query,
} from '@tutorbook/model';

import UserDialog from '@tutorbook/user-dialog';
import Utils from '@tutorbook/utils';
import QueryForm from '@tutorbook/query-form';
import Title from '@tutorbook/title';
import Result from './result';

import styles from './search.module.scss';

interface SearchProps {
  readonly results: ReadonlyArray<User>;
  readonly query: Query;
}

const msgs: Record<string, Msg> = defMsg({
  mentoring: {
    id: 'search.mentoring.title',
    defaultMessage: 'Search mentors.',
  },
  tutoring: {
    id: 'search.tutoring.title',
    defaultMessage: 'Search tutors.',
  },
});

export default function Search({ query, results }: SearchProps): JSX.Element {
  const intl: IntlShape = useIntl();
  const user = useUser();
  const [viewing, setViewing] = React.useState<User | undefined>();
  const getAppt: () => Appt = () => {
    if (!viewing) return new Appt();

    const attendees: AttendeeInterface[] = [
      {
        uid: viewing.uid,
        roles: ['tutor'],
      },
      {
        uid: user.uid,
        roles: ['tutee'],
      },
    ];
    const subjects: string[] = Utils.intersection<string>(
      query.subjects,
      viewing[query.aspect].subjects
    );
    const times: Timeslot[] = Utils.intersection<Timeslot>(
      query.availability,
      viewing.availability,
      (a: Timeslot, b: Timeslot) => a.equalTo(b)
    );

    return new Appt({ attendees, subjects, time: times[0] });
  };
  return (
    <div className={styles.wrapper}>
      {viewing && (
        <UserDialog
          user={viewing}
          appt={getAppt()}
          onClose={() => setViewing(undefined)}
        />
      )}
      <div className={styles.title}>
        <Title>{intl.formatMessage(msgs[query.aspect])}</Title>
      </div>
      <div className={styles.form}>
        <QueryForm query={query} />
      </div>
      <ul className={styles.results}>
        {results.map((res: User, index: number) => (
          <Result user={res} key={index} onClick={() => setViewing(res)} />
        ))}
      </ul>
    </div>
  );
}
