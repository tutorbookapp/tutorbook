import { FormEvent, useCallback, useEffect, useMemo } from 'react';
import { TextField } from '@rmwc/textfield';
import useTranslation from 'next-translate/useTranslation';

import Button from 'components/button';
import MatchSelect from 'components/match-select';
import RecurSelect from 'components/recur-select';
import SubjectSelect from 'components/subject-select';
import TimeSelect from 'components/time-select';
import { useNav } from 'components/dialog/context';

import { Callback } from 'lib/model/callback';
import { Match } from 'lib/model/match';
import { Meeting } from 'lib/model/meeting';
import { Timeslot } from 'lib/model/timeslot';
import { User } from 'lib/model/user';
import { join } from 'lib/utils';
import usePrevious from 'lib/hooks/previous';
import { useUser } from 'lib/context/user';

import styles from './create-page.module.scss';

export interface CreatePageProps {
  people: User[];
  meeting: Meeting;
  setMeeting: Callback<Meeting>;
  onSubmit: (evt: FormEvent) => void;
  loading: boolean;
  checked: boolean;
  error: string;
}

export default function CreatePage({
  people,
  meeting,
  setMeeting,
  onSubmit,
  loading,
  checked,
  error,
}: CreatePageProps): JSX.Element {
  const { user } = useUser();
  const { t } = useTranslation();

  useEffect(() => {
    setMeeting((prev) => new Meeting({ ...prev, creator: user.toPerson() }));
  }, [user, setMeeting]);

  const nav = useNav();
  const prevLoading = usePrevious(loading);
  useEffect(() => {
    if (prevLoading && !loading && checked) nav();
  }, [prevLoading, loading, checked, nav]);

  const onMatchChange = useCallback(
    (match?: Match) => {
      if (match) {
        setMeeting((prev) => new Meeting({ ...prev, match }));
      } else {
        setMeeting((prev) => new Meeting({ ...prev, match: new Match() }));
      }
    },
    [setMeeting]
  );
  const onSubjectsChange = useCallback(
    (subjects: string[]) => {
      setMeeting((prev) => {
        const match = new Match({ ...prev.match, subjects });
        return new Meeting({ ...prev, match });
      });
    },
    [setMeeting]
  );
  const onTimeChange = useCallback(
    (time: Timeslot) => {
      setMeeting((prev) => new Meeting({ ...prev, time }));
    },
    [setMeeting]
  );
  const onRecurChange = useCallback(
    (recur?: string) => {
      setMeeting((prev) => {
        const time = new Timeslot({ ...prev.time, recur });
        return new Meeting({ ...prev, time });
      });
    },
    [setMeeting]
  );
  const onNotesChange = useCallback(
    (evt: FormEvent<HTMLInputElement>) => {
      const notes = evt.currentTarget.value;
      setMeeting((prev) => new Meeting({ ...prev, notes }));
    },
    [setMeeting]
  );

  // TODO: Add support to the `TimeSelect` and the `/api/users/availability` API
  // to query for the merged availability of multiple users (e.g. when all the
  // people in a match are available v.s. just one person).
  const timePersonId = useMemo(() => {
    const idx = people.findIndex(
      (p) => p.roles.includes('tutor') || p.roles.includes('mentor')
    );
    return idx < 0 ? '' : people[idx].id;
  }, [people]);

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <div className={styles.inputs}>
        <MatchSelect
          required
          label='Select match'
          onChange={onMatchChange}
          value={meeting.match.id ? meeting.match : undefined}
          className={styles.field}
          renderToPortal
          outlined
        />
        <SubjectSelect
          required
          label='Select subjects'
          onChange={onSubjectsChange}
          value={meeting.match.subjects}
          className={styles.field}
          renderToPortal
          outlined
        />
        <TimeSelect
          required
          label='Select time'
          onChange={onTimeChange}
          value={meeting.time}
          className={styles.field}
          uid={timePersonId}
          renderToPortal
          outlined
        />
        <RecurSelect
          label='Select recurrence'
          className={styles.field}
          onChange={onRecurChange}
          value={meeting.time.recur}
          outlined
        />
        <TextField
          outlined
          textarea
          rows={4}
          placeholder={t('meeting:notes-placeholder', {
            subject: join(meeting.match.subjects) || 'Computer Science',
          })}
          label='Add description'
          className={styles.field}
          onChange={onNotesChange}
          value={meeting.notes}
        />
        <Button
          className={styles.btn}
          label={t('meeting:create-btn')}
          disabled={loading}
          raised
          arrow
        />
        {!!error && <div className={styles.error}>{error}</div>}
      </div>
    </form>
  );
}
