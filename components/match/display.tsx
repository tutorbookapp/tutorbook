import Link from 'next/link';
import TimeAgo from 'timeago-react';
import Trans from 'next-translate/Trans';
import cn from 'classnames';
import { nanoid } from 'nanoid';
import { useMemo } from 'react';
import useTranslation from 'next-translate/useTranslation';

import Avatar from 'components/avatar';
import LoadingDots from 'components/loading-dots';
import MatchLog from 'components/match/log';

import { Match, Meeting, User } from 'lib/model';
import { join, period } from 'lib/utils';
import { useOrg } from 'lib/context/org';

import styles from './display.module.scss';

interface EventProps {
  badge: string;
  time?: Date;
  person?: User;
  children: React.ReactNode;
}

function Event({ badge, time, person, children }: EventProps): JSX.Element {
  const { org } = useOrg();
  const { lang: locale } = useTranslation();

  return (
    <div className={cn(styles.event, { [styles.loading]: !time || !person })}>
      <div className={styles.badge}>
        {time && person && <span className='material-icons'>{badge}</span>}
      </div>
      <div className={styles.content}>
        {time && (
          <TimeAgo datetime={time} className={styles.time} locale={locale} />
        )}
        {!time && <div className={styles.time} />}
        <div className={styles.body}>
          {person && (
            <>
              <Link href={`/${org?.id || 'default'}/users/${person.id}`}>
                <a>{person.name}</a>
              </Link>{' '}
              {children}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export interface MatchDisplayProps {
  match?: Match;
  people?: User[];
  meetings?: Meeting[];
}

export default function MatchDisplay({
  match,
  people,
  meetings,
}: MatchDisplayProps): JSX.Element {
  const { org } = useOrg();
  const { t } = useTranslation();

  const creator = useMemo(() => {
    if (!people || !match) return;
    const idx = people.findIndex((p) => p.id === match.creator.id);
    return idx < 0 ? new User(match.creator) : people[idx];
  }, [people, match]);

  return (
    <>
      <div className={cn(styles.header, { [styles.loading]: !match })}>
        <div className={styles.wrapper}>
          <div className={styles.people}>
            {people &&
              people.map((person) => (
                <Link
                  href={`/${org?.id || 'default'}/users/${person.id}`}
                  key={person.id}
                >
                  <a className={styles.person}>
                    <div className={styles.avatar}>
                      <Avatar src={person.photo} size={200} />
                    </div>
                    <h1 className={styles.name}>{person.name}</h1>
                    <div className={styles.roles}>Tutor</div>
                  </a>
                </Link>
              ))}
            {!people &&
              [null, null].map(() => (
                <div key={nanoid()} className={styles.person}>
                  <div className={styles.avatar}>
                    <Avatar size={200} loading />
                  </div>
                  <h2 className={styles.name} />
                </div>
              ))}
          </div>
          <div className={styles.info}>
            <dl>
              <dt>Subjects</dt>
              <dd>
                {!match && <LoadingDots />}
                {match && join(match.subjects)}
              </dd>
            </dl>
            <dl>
              <dt>Next meeting time</dt>
              <dd>
                {!match && <LoadingDots />}
                {match && (match.time?.toString() || 'No scheduled meetings')}
              </dd>
            </dl>
            <dl>
              <dt>Meeting venue</dt>
              <dd>
                {!match && <LoadingDots />}
                {match && <a href={match.venue.url}>{match.venue.url}</a>}
              </dd>
            </dl>
          </div>
        </div>
      </div>
      <div className={cn(styles.timeline, { [styles.loading]: !match })}>
        <div className={styles.wrapper}>
          <Event
            badge='add_box'
            time={match ? new Date(match.venue.created) : undefined}
            person={creator}
          >
            {t('matches:event-created')}
          </Event>
          <Event
            badge='email'
            time={match ? new Date(match.venue.created || '') : undefined}
            person={creator}
          >
            <Trans
              i18nKey='matches:event-message'
              components={[<br />]}
              values={{ message: period(match?.message || '') }}
            />
          </Event>
          {meetings &&
            people &&
            meetings.map((meeting) => (
              <Event
                key={meeting.id}
                badge='event_note'
                time={new Date(meeting.created)}
                person={
                  people[
                    people.findIndex((p) => p.id === meeting.creator.id)
                  ] || new User(meeting.creator)
                }
              >
                <Trans
                  i18nKey='matches:event-meeting'
                  components={[<br />]}
                  values={{ time: meeting.time.toString() }}
                />
              </Event>
            ))}
          <MatchLog match={match} />
        </div>
      </div>
    </>
  );
}
