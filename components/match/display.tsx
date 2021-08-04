import { ReactNode, useMemo } from 'react';
import Link from 'next/link';
import TimeAgo from 'timeago-react';
import Trans from 'next-translate/Trans';
import cn from 'classnames';
import { nanoid } from 'nanoid';
import useTranslation from 'next-translate/useTranslation';

import AddBoxIcon from 'components/icons/add-box';
import Avatar from 'components/avatar';
import EmailIcon from 'components/icons/email';
import EventNoteIcon from 'components/icons/event-note';
import LoadingDots from 'components/loading-dots';

import { join, period } from 'lib/utils';
import { Match } from 'lib/model/match';
import { Meeting } from 'lib/model/meeting';
import { User } from 'lib/model/user';
import { useOrg } from 'lib/context/org';

import styles from './display.module.scss';

interface EventProps {
  badge: ReactNode;
  time?: Date;
  person?: User;
  children: React.ReactNode;
}

function Event({ badge, time, person, children }: EventProps): JSX.Element {
  const { org } = useOrg();
  const { lang: locale } = useTranslation();

  return (
    <div className={styles.event}>
      <div className={styles.badge}>{badge}</div>
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

function Endpoint(): JSX.Element {
  return (
    <div className={styles.origin}>
      <div className={styles.badge} />
    </div>
  );
}

export interface MatchDisplayProps {
  match?: Match;
  meetings?: Meeting[];
}

export default function MatchDisplay({
  match,
  meetings,
}: MatchDisplayProps): JSX.Element {
  const { org } = useOrg();
  const { t } = useTranslation();

  const loading = useMemo(() => !match || !meetings, [match, meetings]);

  return (
    <>
      <div className={cn(styles.header, { [styles.loading]: loading })}>
        <div className={styles.wrapper}>
          <div className={styles.people}>
            {!loading &&
              (match?.people || []).map((person) => (
                <Link
                  href={`/${org?.id || 'default'}/users/${person.id}`}
                  key={person.id}
                >
                  <a className={styles.person}>
                    <div className={styles.avatar}>
                      <Avatar src={person.photo} size={200} />
                    </div>
                    <h1 className={styles.name}>{person.name}</h1>
                    <div className={styles.roles}>
                      {join(person.roles.map((r) => t(`common:${r}`))) ||
                        'unknown'}
                    </div>
                  </a>
                </Link>
              ))}
            {loading &&
              Array(2)
                .fill(null)
                .map(() => (
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
                {loading && <LoadingDots />}
                {!loading && join(match?.subjects || [])}
              </dd>
            </dl>
          </div>
        </div>
      </div>
      <div className={cn(styles.timeline, { [styles.loading]: loading })}>
        <div className={styles.wrapper}>
          <Event
            badge={<AddBoxIcon />}
            time={!loading ? new Date(match?.created || '') : undefined}
            person={match?.creator}
          >
            {t('matches:event-created')}
          </Event>
          <Event
            badge={<EmailIcon />}
            time={!loading ? new Date(match?.created || '') : undefined}
            person={match?.creator}
          >
            <Trans
              i18nKey='matches:event-message'
              components={[<br />]}
              values={{ message: period(match?.message || '') }}
            />
          </Event>
          {!loading &&
            (meetings || []).map((meeting) => (
              <Event
                key={meeting.id}
                badge={<EventNoteIcon />}
                time={new Date(meeting.created)}
                person={(() => {
                  const findCreator = (p: User) => p.id === meeting.creator.id;
                  return match?.people[match.people.findIndex(findCreator)];
                })()}
              >
                <Trans
                  i18nKey='matches:event-meeting'
                  components={[<br />]}
                  values={{ time: meeting.time.toString() }}
                />
              </Event>
            ))}
          <Endpoint />
        </div>
      </div>
    </>
  );
}
