import { Chip, ChipSet } from '@rmwc/chip';
import axios, { AxiosError } from 'axios';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import to from 'await-to-js';
import useTranslation from 'next-translate/useTranslation';

import Avatar from 'components/avatar';

import { Callback, Meeting } from 'lib/model';
import { join, period } from 'lib/utils';
import { APIErrorJSON } from 'lib/api/error';
import snackbar from 'lib/snackbar';
import { useClickContext } from 'lib/hooks/click-outside';

import styles from './display-page.module.scss';
import { useCalendar } from './context';

export interface DisplayPageProps {
  meeting: Meeting;
  openEdit: () => void;
  setLoading: Callback<boolean>;
  setChecked: Callback<boolean>;
}

export default function DisplayPage({
  meeting,
  openEdit,
  setLoading,
  setChecked,
}: DisplayPageProps): JSX.Element {
  const { t } = useTranslation();
  const { removeMeeting } = useCalendar();

  const [error, setError] = useState<string>('');
  const deleteMeeting = useCallback(async () => {
    setError('');
    setChecked(false);
    setLoading(true);
    const [err] = await to(axios.delete(`/api/meetings/${meeting.id}`));
    if (err) {
      const e = (err as AxiosError<APIErrorJSON>).response?.data || err;
      setLoading(false);
      setError(e.message);
    } else {
      setChecked(true);
      setTimeout(() => removeMeeting(meeting.id), 1000);
    }
  }, [setLoading, setChecked, removeMeeting, meeting.id]);

  const { updateEl, removeEl } = useClickContext();
  useEffect(() => {
    // TODO: Close snackbar when delete button is clicked repeatedly (i.e. when
    // error is reset; similar to how it works when using the component).
    if (error)
      snackbar.notify({
        body: t('meeting:delete-error', { error: period(error) }),
        actions: [
          {
            label: t('common:retry'),
            onClick: deleteMeeting,
          },
        ],
        onClose: () => setError(''),
        dismissesOnAction: true,
        ref(node: HTMLElement | null): void {
          if (!node) return removeEl(`meeting-delete-error-${meeting.id}`);
          return updateEl(`meeting-delete-error-${meeting.id}`, node);
        },
      });
  }, [error, removeEl, updateEl, deleteMeeting, meeting.id, t]);

  return (
    <>
      <div className={styles.content}>
        <div className={styles.people}>
          {meeting.match.people.map((person) => (
            <Link
              href={`/${meeting.match.org}/users/${person.id}`}
              key={person.id}
            >
              <a className={styles.person}>
                <div className={styles.avatar}>
                  <Avatar src={person.photo} size={160} />
                </div>
                <div className={styles.name}>{person.name}</div>
                <div className={styles.roles}>{join(person.roles)}</div>
              </a>
            </Link>
          ))}
        </div>
        <div className={styles.info}>
          <dl>
            <dt>Subjects</dt>
            <dd>{join(meeting.match.subjects)}</dd>
          </dl>
          <dl>
            <dt>Meeting venue</dt>
            <dd>
              <a href={meeting.venue.url}>{meeting.venue.url}</a>
            </dd>
          </dl>
        </div>
      </div>
      <div className={styles.actions}>
        <ChipSet className={styles.chips}>
          <Chip icon='edit' label='Edit meeting' onClick={openEdit} />
          <Chip icon='delete' label='Delete meeting' onClick={deleteMeeting} />
        </ChipSet>
      </div>
    </>
  );
}
