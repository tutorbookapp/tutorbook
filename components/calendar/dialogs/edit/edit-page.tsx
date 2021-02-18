import { FormEvent, useCallback, useEffect, useMemo } from 'react';
import { TextField } from '@rmwc/textfield';
import axios from 'axios';
import useTranslation from 'next-translate/useTranslation';

import Button from 'components/button';
import SubjectSelect from 'components/subject-select';
import TimeSelect from 'components/time-select';
import { useNav } from 'components/dialog/context';

import {
  Callback,
  Match,
  Meeting,
  MeetingJSON,
  Timeslot,
  User,
} from 'lib/model';
import { usePrevious, useSingle } from 'lib/hooks';
import { join } from 'lib/utils';

import { useCalendar } from '../../context';

import styles from './edit-page.module.scss';

export interface EditPageProps {
  people: User[];
  meeting: Meeting;
  dialogOpen: boolean;
  setLoading: Callback<boolean>;
  setChecked: Callback<boolean>;
}

export default function EditPage({
  people,
  meeting: initialData,
  dialogOpen,
  setLoading,
  setChecked,
}: EditPageProps): JSX.Element {
  const updateRemote = useCallback(async (updated: Meeting) => {
    const url = `/api/meetings/${updated.id}`;
    const { data } = await axios.put<MeetingJSON>(url, updated.toJSON());
    return Meeting.fromJSON(data);
  }, []);

  const { t } = useTranslation();
  const { mutateMeeting } = useCalendar();
  const {
    data: meeting,
    setData: setMeeting,
    onSubmit,
    loading,
    checked,
    error,
  } = useSingle(initialData, updateRemote, mutateMeeting, { sync: dialogOpen });

  const nav = useNav();
  const prevLoading = usePrevious(loading);
  useEffect(() => {
    if (prevLoading && !loading && checked) nav();
  }, [prevLoading, loading, checked, nav]);

  useEffect(() => setLoading(loading), [loading, setLoading]);
  useEffect(() => setChecked(checked), [checked, setChecked]);

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
    return idx < 0 ? people[0].id || '' : people[idx].id;
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
