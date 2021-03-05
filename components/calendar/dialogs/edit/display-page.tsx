import { Chip, ChipSet } from '@rmwc/chip';
import axios, { AxiosError } from 'axios';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import to from 'await-to-js';
import useTranslation from 'next-translate/useTranslation';

import Avatar from 'components/avatar';

import { APIErrorJSON } from 'lib/api/error';
import { Meeting } from 'lib/model/meeting';
import { User } from 'lib/model/user';
import { join } from 'lib/utils';
import snackbar from 'lib/snackbar';

import { useCalendar } from '../../context';

import styles from './display-page.module.scss';

export interface DisplayPageProps {
  people: User[];
  meeting: Meeting;
  openEdit: () => void;
}

export default function DisplayPage({
  people,
  meeting,
  openEdit,
}: DisplayPageProps): JSX.Element {
  const { t } = useTranslation();
  const { removeMeeting } = useCalendar();

  const [error, setError] = useState<string>('');
  const deleteMeeting = useCallback(async () => {
    setError('');
    console.log('Delete checked:', false);
    console.log('Delete loading:', true);
    const endpoint = `/api/meetings/${meeting.parentId || meeting.id}`;
    const [err] = await to(axios.delete(endpoint));
    if (err) {
      const e = (err as AxiosError<APIErrorJSON>).response?.data || err;
      console.log('Delete loading:', false);
      setError(e.message);
    } else {
      console.log('Delete checked:', true);
      setTimeout(() => {
        // TODO: Locally mutate and remove all meetings with `parentId`.
        void removeMeeting(meeting.parentId || meeting.id, true);
      }, 1000);
    }
  }, [removeMeeting, meeting.id, meeting.parentId]);

  useEffect(() => {
    // TODO: Close snackbar when delete button is clicked repeatedly (i.e. when
    // error is reset; similar to how it works when using the component).
    if (error)
      snackbar.notify({
        body: t('meeting:delete-error'),
        actions: [
          {
            label: t('common:retry'),
            onClick: deleteMeeting,
          },
        ],
        onClose: () => setError(''),
        dismissesOnAction: true,
      });
  }, [error, deleteMeeting, meeting.id, t]);

  return (
    <>
      <div className={styles.content}>
        <div className={styles.people}>
          {people.map((person) => (
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
