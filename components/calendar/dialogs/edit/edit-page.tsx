import { FormEvent, useCallback, useEffect, useMemo } from 'react';
import { TextField } from '@rmwc/textfield';
import useTranslation from 'next-translate/useTranslation';

import Button from 'components/button';
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

import styles from './edit-page.module.scss';

export interface EditPageProps {
  people: User[];
  meeting: Meeting;
  setMeeting: Callback<Meeting>;
  onSubmit: (evt: FormEvent) => void;
  loading: boolean;
  checked: boolean;
  error: string;
}

export default function EditPage({
  people,
  meeting,
  setMeeting,
  onSubmit,
  loading,
  checked,
  error,
}: EditPageProps): JSX.Element {
  const { t } = useTranslation();

  const nav = useNav();
  const prevLoading = usePrevious(loading);
  useEffect(() => {
    if (prevLoading && !loading && checked) nav();
  }, [prevLoading, loading, checked, nav]);

  // TODO: Update the meeting's match's subjects. Right now, our back-end
  // ignores any changes to the match data (when PUT /api/meetings/[id]).
  const onSubjectsChange = useCallback(
    (subjects: string[]) => {
      setMeeting(
        (prev) =>
          new Meeting({
            ...prev,
            match: new Match({ ...prev.match, subjects }),
          })
      );
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

  const subjectOptions = useMemo(() => {
    const subjects = new Set<string>();
    people.forEach((p) => {
      if (p.roles.includes('tutor'))
        p.tutoring.subjects.forEach((s) => subjects.add(s));
      if (p.roles.includes('mentor'))
        p.mentoring.subjects.forEach((s) => subjects.add(s));
    });
    return [...subjects];
  }, [people]);

  // TODO: Add support to the `TimeSelect` and the `/api/users/availability` API
  // to query for the merged availability of multiple users (e.g. when all the
  // people in a match are available v.s. just one person).
  const timePersonId = useMemo(() => {
    const idx = people.findIndex(
      (p) => p.roles.includes('tutor') || p.roles.includes('mentor')
    );
    return idx < 0 ? (people[0] || { id: '' }).id : people[idx].id;
  }, [people]);

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <div className={styles.inputs}>
        <SubjectSelect
          required
          autoOpenMenu
          label={t('common:subjects')}
          onChange={onSubjectsChange}
          value={meeting.match.subjects}
          className={styles.field}
          options={subjectOptions}
          renderToPortal
          outlined
        />
        <TimeSelect
          required
          label={t('common:time')}
          onChange={onTimeChange}
          value={meeting.time}
          className={styles.field}
          uid={timePersonId}
          renderToPortal
          outlined
        />
        <RecurSelect
          label='Recurrence'
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
          label={t('meeting:notes')}
          className={styles.field}
          onChange={onNotesChange}
          value={meeting.notes}
        />
        <Button
          className={styles.btn}
          label={t('meeting:update-btn')}
          disabled={loading}
          raised
          arrow
        />
        {!!error && <div className={styles.error}>{error}</div>}
      </div>
    </form>
  );
}
