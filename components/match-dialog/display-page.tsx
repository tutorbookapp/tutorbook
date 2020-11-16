import { Chip, ChipSet } from '@rmwc/chip';
import Link from 'next/link';

import Avatar from 'components/avatar';

import { Callback, MatchJSON, Timeslot } from 'lib/model';
import { onlyFirstNameAndLastInitial } from 'lib/api/get/truncated-users';
import { join } from 'lib/utils';

import styles from './page.module.scss';

function Event({ badge, time, person, body }: EventProps): JSX.Element {
  return (
    <div className={styles.event}>
      <div className={styles.badge}>{badge}</div>
      <div className={styles.content}>
        <div className={styles.time}>{time}</div>
        <div className={styles.body}>
          <Link href={`/gunn/people/${person.id}`}>
            <a>{person.name}</a>
          </Link>
          {` ${body}`}
        </div>
      </div>
    </div>
  );
}

function Origin(): JSX.Element {
  return (
    <div className={styles.origin}>
      <div className={styles.badge} />
    </div>
  );
}

export interface DisplayPageProps {
  match: MatchJSON;
  setActive: Callback<number>;
}

export default function DisplayPage({
  match,
  setActive,
}: DisplayPageProps): JSX.Element {
  return (
    <>
      <div className={styles.content}>
        <div className={styles.display}>
          <div className={styles.header}>People</div>
          <div className={styles.people}>
            {match.people.map((person) => (
              <div className={styles.person}>
                <a href={person.photo} className={styles.avatar}>
                  <Avatar src={person.photo} size={82} />
                </a>
                <Link href={`/gunn/people/${person.id}`}>
                  <a className={styles.name}>
                    {`${onlyFirstNameAndLastInitial(person.name)} (${join(
                      person.roles
                    )})`}
                  </a>
                </Link>
              </div>
            ))}
          </div>
          <div className={styles.header}>Subjects</div>
          <div className={styles.body}>{join(match.subjects)}</div>
          <div className={styles.header}>Next appointment time</div>
          <div className={styles.body}>
            {new Timeslot({ from: new Date(), to: new Date() }).toString()}
          </div>
          <div className={styles.header}>Venue</div>
          <a href={match.venue.url} className={styles.body}>
            {match.venue.url}
          </a>
        </div>
        <div className={styles.timeline}>
          <Origin />
          <Event
            badge='C'
            time='A month ago'
            person={match.people[1]}
            body='created this match.'
          />
          <Event
            badge='M'
            time='A month ago'
            person={match.people[1]}
            body='sent a message: "I could really use your help with learning how to use Cypress for integration and unit tests."'
          />
          <Event
            badge='A'
            time='Two weeks ago'
            person={match.people[0]}
            body='logged a meeting on Tuesday, November 3, 4:30 PM - 5:00 PM.'
          />
          <Event
            badge='E'
            time='One week ago'
            person={match.people[1]}
            body='removed the "Data Science" subject.'
          />
          <Event
            badge='A'
            time='Three days ago'
            person={match.people[0]}
            body='logged a meeting on Sunday, November 8, 4:30 PM - 5:00 PM.'
          />
          <Origin />
        </div>
      </div>
      <div className={styles.actions}>
        <ChipSet className={styles.chips}>
          <Chip icon='group_add' label='Create match' />
          <Chip icon='person_add' label='Create request' />
          <Chip icon='email' label='Send email' />
          <Chip icon='edit' label='Edit profile' onClick={() => setActive(1)} />
        </ChipSet>
      </div>
    </>
  );
}
