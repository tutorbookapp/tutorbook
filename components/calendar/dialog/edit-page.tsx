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
import UserSelect from 'components/user-select';

import { Meeting } from 'lib/model/meeting';
import { Subject } from 'lib/model/subject';
import { Timeslot } from 'lib/model/timeslot';
import { User } from 'lib/model/user';
import { UsersQueryInterface } from 'lib/model/query/users';
import { join } from 'lib/utils';
import { useOrg } from 'lib/context/org';
import usePrevious from 'lib/hooks/previous';
import { useUser } from 'lib/context/user';

import { DialogPage, useCalendarState } from '../state';

import styles from './page.module.scss';

export interface EditPageProps {
  people: User[];
  loading: boolean;
  checked: boolean;
  error: string;
}

export default function EditPage({
  people,
  loading,
  checked,
  error,
}: EditPageProps): JSX.Element {
  const { editing, setEditing, onEditStop, setDialogPage } = useCalendarState();
  const { t } = useTranslation();

  const prevLoading = usePrevious(loading);
  useEffect(() => {
    if (prevLoading && !loading && checked) setDialogPage(DialogPage.Display);
  }, [prevLoading, loading, checked, setDialogPage]);

  const onSubjectsChange = useCallback(
    (subjects: Subject[]) => {
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
  const onLinkChange = useCallback(
    (evt: FormEvent<HTMLInputElement>) => {
      const venue = evt.currentTarget.value;
      setEditing((prev) => new Meeting({ ...prev, venue }));
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
    const subjects: Subject[] = []; 
    people.forEach((p) => {
      if (p.roles.includes('tutor')) 
        p.subjects.forEach((s) => {
          if (subjects.every((o) => o.id !== s.id)) subjects.push(s)
        });
    });
    return subjects.length ? subjects : undefined;
  }, [people]);

  // TODO: Add support to the `TimeSelect` and the `/api/users/availability` API
  // to query for the merged availability of multiple users (e.g. when all the
  // people in a match are available v.s. just one person).
  const timePersonId = useMemo(() => {
    const idx = people.findIndex((p) => p.roles.includes('tutor'));
    return idx < 0 ? (people[0] || { id: '' }).id : people[idx].id;
  }, [people]);

  const students = useMemo(
    () => editing.people.filter((p) => p.roles.includes('tutee')),
    [editing.people]
  );
  const tutors = useMemo(
    () => editing.people.filter((p) => p.roles.includes('tutor')),
    [editing.people]
  );
  const parents = useMemo(
    () => editing.people.filter((p) => p.roles.includes('parent')),
    [editing.people]
  );
  const onStudentsChange = useCallback(
    (u: User[]) => {
      setEditing((prev) => {
        const ppl = prev.people.filter((p) => !p.roles.includes('tutee'));
        return new Meeting({
          ...prev,
          people: [
            ...ppl,
            ...u.map((p) => new User({ ...p, roles: ['tutee'] })),
          ],
        });
      });
    },
    [setEditing]
  );
  const onTutorsChange = useCallback(
    (u: User[]) => {
      setEditing((prev) => {
        const ppl = prev.people.filter((p) => !p.roles.includes('tutor'));
        return new Meeting({
          ...prev,
          people: [
            ...ppl,
            ...u.map((p) => new User({ ...p, roles: ['tutor'] })),
          ],
        });
      });
    },
    [setEditing]
  );
  const onParentsChange = useCallback(
    (u: User[]) => {
      setEditing((prev) => {
        const ppl = prev.people.filter((p) => !p.roles.includes('parent'));
        return new Meeting({
          ...prev,
          people: [
            ...ppl,
            ...u.map((p) => new User({ ...p, roles: ['parent'] })),
          ],
        });
      });
    },
    [setEditing]
  );

  const { user } = useUser();
  const { org } = useOrg();
  const studentsQuery = useMemo<Partial<UsersQueryInterface>>(
    () => (org ? { orgs: [org.id] } : { met: [user.id, 'tutee'] }),
    [org, user.id]
  );
  const tutorsQuery = useMemo<Partial<UsersQueryInterface>>(
    () => (org ? { orgs: [org.id] } : { met: [user.id, 'tutor'] }),
    [org, user.id]
  );
  const parentsQuery = useMemo<Partial<UsersQueryInterface>>(
    () => (org ? { orgs: [org.id] } : { met: [user.id, 'parent'] }),
    [org, user.id]
  );

  return (
    <div className={styles.wrapper}>
      <Loader active={!!loading} checked={!!checked} />
      <div className={styles.nav}>
        <IconButton
          icon={<CloseIcon />}
          className={styles.btn}
          onClick={() => setDialogPage(DialogPage.Display)}
        />
      </div>
      <form className={styles.form} onSubmit={onEditStop}>
        <div className={styles.inputs}>
          <UserSelect
            required
            label='Select students'
            query={studentsQuery}
            onUsersChange={onStudentsChange}
            users={students}
            className={styles.field}
            renderToPortal
            autoOpenMenu
            outlined
          />
          <UserSelect
            required
            label='Select tutors'
            query={tutorsQuery}
            onUsersChange={onTutorsChange}
            users={tutors}
            className={styles.field}
            renderToPortal
            autoOpenMenu
            outlined
          />
          <UserSelect
            label='Select parents'
            query={parentsQuery}
            onUsersChange={onParentsChange}
            users={parents}
            className={styles.field}
            renderToPortal
            autoOpenMenu
            outlined
          />
        </div>
        <div className={styles.divider} />
        <div className={styles.inputs}>
          <TextField
            label='Meeting link'
            onChange={onLinkChange}
            value={editing.venue}
            className={styles.field}
            outlined
            required
          />
          <SubjectSelect
            required
            label={t('common:subjects')}
            onChange={onSubjectsChange}
            value={editing.subjects}
            className={styles.field}
            options={subjectOptions}
            renderToPortal
            autoOpenMenu
            outlined
          />
          <TimeSelect
            required
            label={t('common:time')}
            onChange={onTimeChange}
            value={editing.time}
            className={styles.field}
            uid={timePersonId}
            renderToPortal
            outlined
          />
          <RecurSelect
            label='Recurrence'
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
            label={t('meeting:description')}
            className={styles.field}
            onChange={onDescriptionChange}
            value={editing.description}
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
    </div>
  );
}
