import React, { useMemo, useCallback, useState } from 'react';
import Avatar from 'components/avatar';
import Carousel from 'components/carousel';
import VolunteerForm from 'components/volunteer-form';
import RequestDialog from 'components/request-dialog';

import { Card } from '@rmwc/card';
import { User, OrgJSON, UsersQuery, SocialInterface } from 'lib/model';

import SearchForm from './search-form';

import styles from './org-display.module.scss';

interface OrgDisplayProps {
  org: OrgJSON;
}

export default function OrgDisplay({ org }: OrgDisplayProps): JSX.Element {
  const query: UsersQuery = useMemo(() => {
    return new UsersQuery({
      orgs: [{ value: org.id, label: org.name }],
      aspect: org.aspect,
    });
  }, [org.id, org.name, org.aspect]);
  const [viewing, setViewing] = useState<User | undefined>();
  const onClosed = useCallback(() => setViewing(undefined), []);
  const subjects = useMemo(() => [], []);
  return (
    <div className={styles.wrapper}>
      {!!viewing && (
        <RequestDialog
          user={viewing}
          aspect={query.aspect}
          onClosed={onClosed}
          subjects={subjects}
        />
      )}
      <div className={styles.left}>
        <a
          className={styles.img}
          href={org.photo}
          target='_blank'
          rel='noreferrer'
          tabIndex={-1}
        >
          <Avatar src={org.photo} />
        </a>
        <h4 className={styles.name}>{org.name}</h4>
        {org.socials && !!org.socials.length && (
          <div className={styles.socials}>
            {org.socials.map((social: SocialInterface) => (
              <a
                key={social.type}
                target='_blank'
                rel='noreferrer'
                href={social.url}
                className={`${styles.socialLink} ${styles[social.type]}`}
              >
                {social.type}
              </a>
            ))}
          </div>
        )}
      </div>
      <div className={styles.right}>
        <h6 className={styles.header}>About</h6>
        <p className={styles.content}>{org.bio}</p>
        <h6 className={styles.header}>Safeguarding</h6>
        <p className={styles.content}>{org.safeguarding}</p>
        <h6 className={`${styles.header} ${styles.searchHeader}`}>
          {`Featured ${query.aspect === 'mentoring' ? 'mentors' : 'tutors'}`}
        </h6>
        <Carousel query={query} onClick={setViewing} />
        <Card className={styles.card}>
          <SearchForm aspect={query.aspect} org={org} />
        </Card>
        <h6 className={`${styles.header} ${styles.signupHeader}`}>
          {`Become a ${query.aspect === 'mentoring' ? 'mentor' : 'tutor'}`}
        </h6>
        <VolunteerForm aspect={query.aspect} org={org.id} />
      </div>
    </div>
  );
}
