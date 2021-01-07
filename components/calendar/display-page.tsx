import { Chip, ChipSet } from '@rmwc/chip';
import Link from 'next/link';

import Avatar from 'components/avatar';

import { Meeting } from 'lib/model';
import { join } from 'lib/utils';

import styles from './display-page.module.scss';

export interface DisplayPageProps {
  meeting: Meeting;
  openEdit: () => void;
  openDelete: () => void;
}

export default function DisplayPage({
  meeting,
  openEdit,
  openDelete,
}: DisplayPageProps): JSX.Element {
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
          <Chip icon='delete' label='Delete meeting' onClick={openDelete} />
        </ChipSet>
      </div>
    </>
  );
}
