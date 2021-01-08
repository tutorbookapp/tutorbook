import { FormEvent, useCallback, useEffect, useLayoutEffect } from 'react';
import { TextField } from '@rmwc/textfield';
import axios from 'axios';
import useTranslation from 'next-translate/useTranslation';

import Button from 'components/button';
import SubjectSelect from 'components/subject-select';
import TimeSelect from 'components/time-select';
import { useNav } from 'components/dialog/context';

import { Callback, Match, Meeting, MeetingJSON, Timeslot } from 'lib/model';
import { usePrevious, useSingle } from 'lib/hooks';
import { join } from 'lib/utils';

import styles from './edit-page.module.scss';
import { useCalendar } from './context';

export interface EditPageProps {
  meeting: Meeting;
  setLoading: Callback<boolean>;
  setChecked: Callback<boolean>;
}

export default function EditPage({
  meeting: initialData,
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
  } = useSingle(initialData, updateRemote, mutateMeeting);

  const nav = useNav();
  const prevLoading = usePrevious(loading);
  useLayoutEffect(() => {
    if (prevLoading && !loading && !error) nav();
  }, [prevLoading, loading, error, nav]);

  useEffect(() => setLoading(loading), [loading, setLoading]);
  useEffect(() => setChecked(checked), [checked, setChecked]);

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
          renderToPortal
          outlined
        />
        <TimeSelect
          required
          label={t('common:time')}
          onChange={onTimeChange}
          value={meeting.time}
          className={styles.field}
          renderToPortal
          outlined
        />
        <TextField
          outlined
          textarea
          rows={4}
          required
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
