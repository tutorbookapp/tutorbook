import { FormEvent, useCallback, useEffect, useMemo } from 'react';
import { TextField } from '@rmwc/textfield';
import axios from 'axios';
import useTranslation from 'next-translate/useTranslation';

import Button from 'components/button';
import MatchSelect from 'components/match-select';
import RecurSelect from 'components/recur-select';
import SubjectSelect from 'components/subject-select';
import TimeSelect from 'components/time-select';
import { useNav } from 'components/dialog/context';

import {
  Match,
  Meeting,
  MeetingJSON,
  TCallback,
  Timeslot,
  User,
} from 'lib/model';
import { usePrevious, useSingle } from 'lib/hooks';
import clone from 'lib/utils/clone';
import { join } from 'lib/utils';
import { useUser } from 'lib/context/user';

import styles from './create-page.module.scss';

export interface CreatePageProps {
  people: User[];
  viewing: Meeting;
  setViewing: TCallback<Meeting>;
  setLoading: TCallback<boolean>;
  setChecked: TCallback<boolean>;
}

export default function CreatePage({
  people,
  viewing,
  setViewing,
  setLoading,
  setChecked,
}: CreatePageProps): JSX.Element {
  // TODO: Revalidate local data after creation to account for recur rules.
  const updateRemote = useCallback(async (updated: Meeting) => {
    const created = new Meeting(clone({ ...updated, id: '' })).toJSON();
    const { data } = await axios.post<MeetingJSON>('/api/meetings', created);
    return Meeting.fromJSON(data);
  }, []);

  const { user } = useUser();
  const { t } = useTranslation();
  const {
    data: meeting,
    setData: setMeeting,
    onSubmit,
    loading,
    checked,
    error,
  } = useSingle(viewing, updateRemote, setViewing, { sync: true });

  useEffect(() => {
    setMeeting((prev) => new Meeting({ ...prev, creator: user.toPerson() }));
  }, [user, setMeeting]);

  const nav = useNav();
  const prevLoading = usePrevious(loading);
  useEffect(() => {
    if (prevLoading && !loading && checked) nav();
  }, [prevLoading, loading, checked, nav]);

  useEffect(() => setLoading(loading), [loading, setLoading]);
  useEffect(() => setChecked(checked), [checked, setChecked]);

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
    (recur: string) => {
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
