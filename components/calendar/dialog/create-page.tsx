import { FormEvent, useCallback, useEffect, useMemo } from 'react';
import { IconButton } from '@rmwc/icon-button';
import { TextField } from '@rmwc/textfield';
import useTranslation from 'next-translate/useTranslation';

import Button from 'components/button';
import CloseIcon from 'components/icons/close';
import Loader from 'components/loader';
import RecurSelect from 'components/recur-select';
import SubjectSelect from 'components/subject-select';
import TimeSelect from 'components/time-select';
import { useNav } from 'components/dialog/context';

import { Meeting } from 'lib/model/meeting';
import { Timeslot } from 'lib/model/timeslot';
import { User } from 'lib/model/user';
import { join } from 'lib/utils';
import usePrevious from 'lib/hooks/previous';

import { DialogPage, useCalendarState } from '../state';

import styles from './page.module.scss';

export interface CreatePageProps {
  people: User[];
  loading: boolean;
  checked: boolean;
  error: string;
}

export default function CreatePage({
  people,
  loading,
  checked,
  error,
}: CreatePageProps): JSX.Element {
  const { editing, setEditing, onEditStop, setDialogPage } = useCalendarState();
  const { t } = useTranslation();
  const nav = useNav();

  const prevLoading = usePrevious(loading);
  useEffect(() => {
    if (prevLoading && !loading && checked) setDialogPage(DialogPage.Display);
  }, [prevLoading, loading, checked, setDialogPage]);

  const onSubjectsChange = useCallback(
    (subjects: string[]) => {
      setEditing((prev) => new Meeting({ ...prev, subjects }));
    },
    [setEditing]
  );
  const onTimeChange = useCallback(
    (time: Timeslot) => {
      setEditing((prev) => new Meeting({ ...prev, time }));
    },
    [setEditing]
  );
  const onRecurChange = useCallback(
    (recur?: string) => {
      setEditing((prev) => {
        const time = new Timeslot({ ...prev.time, recur });
        return new Meeting({ ...prev, time });
      });
    },
    [setEditing]
  );
  const onDescriptionChange = useCallback(
    (evt: FormEvent<HTMLInputElement>) => {
      const description = evt.currentTarget.value;
      setEditing((prev) => new Meeting({ ...prev, description }));
    },
    [setEditing]
  );

  const subjectOptions = useMemo(() => {
    const subjects = new Set<string>();
    people.forEach((p) => {
      if (p.roles.includes('tutor') || p.roles.includes('mentor'))
        p.subjects.forEach((s) => subjects.add(s));
    });
    return subjects.size ? [...subjects] : undefined;
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
    <div className={styles.wrapper}>
      <Loader active={!!loading} checked={!!checked} />
      <div className={styles.nav}>
        <IconButton icon={<CloseIcon />} className={styles.btn} onClick={nav} />
      </div>
      <form className={styles.form} onSubmit={onEditStop}>
        <div className={styles.inputs}>
          <SubjectSelect
            required
            label='Select subjects'
            onChange={onSubjectsChange}
            value={editing.subjects}
            className={styles.field}
            options={subjectOptions}
            renderToPortal
            outlined
          />
          <TimeSelect
            required
            label='Select time'
            onChange={onTimeChange}
            value={editing.time}
            className={styles.field}
            uid={timePersonId}
            renderToPortal
            outlined
          />
          <RecurSelect
            label='Select recurrence'
            className={styles.field}
            onChange={onRecurChange}
            value={editing.time.recur}
            outlined
          />
          <TextField
            outlined
            textarea
            rows={4}
            placeholder={t('meeting:description-placeholder', {
              subject: join(editing.subjects) || 'Computer Science',
            })}
            label='Add description'
            className={styles.field}
            onChange={onDescriptionChange}
            value={editing.description}
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
    </div>
  );
}
