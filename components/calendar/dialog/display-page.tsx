import { Chip, ChipSet } from '@rmwc/chip';
import Link from 'next/link';

import Avatar from 'components/avatar';

import { User } from 'lib/model/user';
import { join } from 'lib/utils';

import { useCalendarState } from '../state';

import styles from './display-page.module.scss';

export interface DisplayPageProps {
  people: User[];
  openEdit: () => void;
}

export default function DisplayPage({
  people,
  openEdit,
}: DisplayPageProps): JSX.Element {
  const { editing } = useCalendarState();

  return (
    <>
      <div className={styles.content}>
        <div className={styles.people}>
          {people.map((person) => (
            <Link
              href={`/${editing.match.org}/users/${person.id}`}
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
            <dd>{join(editing.match.subjects)}</dd>
          </dl>
          <dl>
            <dt>Meeting venue</dt>
            <dd>
              <a href={editing.venue.url}>{editing.venue.url}</a>
            </dd>
          </dl>
        </div>
      </div>
      <div className={styles.actions}>
        <ChipSet className={styles.chips}>
          <Chip icon='edit' label='Edit meeting' onClick={openEdit} />
          <Chip icon='delete' label='Delete meeting' />
        </ChipSet>
      </div>
    </>
  );
}
