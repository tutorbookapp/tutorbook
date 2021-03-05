import { Chip, ChipSet } from '@rmwc/chip';
import { IconButton } from '@rmwc/icon-button';
import Link from 'next/link';

import Avatar from 'components/avatar';
import Loader from 'components/loader';
import { useNav } from 'components/dialog/context';

import { Callback } from 'lib/model/callback';
import { User } from 'lib/model/user';
import { join } from 'lib/utils';

import { useCalendarState } from '../state';

import styles from './page.module.scss';

export interface DisplayPageProps {
  people: User[];
  setPage: Callback<number>;
  loading: boolean;
  checked: boolean;
}

export default function DisplayPage({
  people,
  setPage,
  loading,
  checked,
}: DisplayPageProps): JSX.Element {
  const { editing } = useCalendarState();
  const nav = useNav();

  return (
    <div className={styles.wrapper}>
      <Loader active={!!loading} checked={!!checked} />
      <div className={styles.nav}>
        <IconButton icon='close' className={styles.btn} onClick={nav} />
        <Link href={`/${editing.match.org}/matches/${editing.match.id}`}>
          <IconButton icon='open_in_new' className={styles.btn} />
        </Link>
      </div>
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
          <Chip icon='edit' label='Edit meeting' onClick={() => setPage(1)} />
          <Chip icon='delete' label='Delete meeting' />
        </ChipSet>
      </div>
    </div>
  );
}
