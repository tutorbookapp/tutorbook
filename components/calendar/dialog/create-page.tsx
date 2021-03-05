import { FormEvent, useCallback, useEffect, useMemo } from 'react';
import { IconButton } from '@rmwc/icon-button';
import { TextField } from '@rmwc/textfield';
import useTranslation from 'next-translate/useTranslation';

import Button from 'components/button';
import Loader from 'components/loader';
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

import { useCalendarState } from '../state';

import styles from './page.module.scss';

export interface CreatePageProps {
  people: User[];
  setPage: Callback<number>;
  loading: boolean;
  checked: boolean;
  error: string;
}

export default function CreatePage({
  people,
  setPage,
  loading,
  checked,
  error,
}: CreatePageProps): JSX.Element {
  const { editing, setEditing, onEditStop } = useCalendarState();
  const { t } = useTranslation();
  const nav = useNav();

  const prevLoading = usePrevious(loading);
  useEffect(() => {
    if (prevLoading && !loading && checked) setPage(0);
  }, [prevLoading, loading, checked, setPage]);

  const onMatchChange = useCallback(
    (match?: Match) => {
      if (match) {
        setEditing((prev) => new Meeting({ ...prev, match }));
      } else {
        setEditing((prev) => new Meeting({ ...prev, match: new Match() }));
      }
    },
    [setEditing]
  );
  const onSubjectsChange = useCallback(
    (subjects: string[]) => {
      setEditing((prev) => {
        const match = new Match({ ...prev.match, subjects });
        return new Meeting({ ...prev, match });
      });
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
  const onNotesChange = useCallback(
    (evt: FormEvent<HTMLInputElement>) => {
      const notes = evt.currentTarget.value;
      setEditing((prev) => new Meeting({ ...prev, notes }));
    },
    [setEditing]
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
    <div className={styles.wrapper}>
      <Loader active={!!loading} checked={!!checked} />
      <div className={styles.nav}>
        <IconButton icon='close' className={styles.btn} onClick={nav} />
      </div>
      <form className={styles.form} onSubmit={onEditStop}>
        <div className={styles.inputs}>
          <MatchSelect
            required
            label='Select match'
            onChange={onMatchChange}
            value={editing.match.id ? editing.match : undefined}
            className={styles.field}
            renderToPortal
            outlined
          />
          <SubjectSelect
            required
            label='Select subjects'
            onChange={onSubjectsChange}
            value={editing.match.subjects}
            className={styles.field}
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
            placeholder={t('meeting:notes-placeholder', {
              subject: join(editing.match.subjects) || 'Computer Science',
            })}
            label='Add description'
            className={styles.field}
            onChange={onNotesChange}
            value={editing.notes}
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
