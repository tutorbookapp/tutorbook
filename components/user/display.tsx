import { useEffect, useMemo, useState } from 'react';
import { IconButton } from '@rmwc/icon-button';
import Image from 'next/image';
import Link from 'next/link';
import cn from 'classnames';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';

import Avatar from 'components/avatar';
import RequestForm from 'components/user/request-form';

import { User, isAspect } from 'lib/model';
import { join, langsToOptions } from 'lib/utils';
import { useOrg } from 'lib/context/org';
import { useUser } from 'lib/context/user';

import styles from './display.module.scss';

export interface UserDisplayProps {
  user?: User;
}

export default function UserDisplay({ user }: UserDisplayProps): JSX.Element {
  const { org } = useOrg();
  const { query } = useRouter();
  const { lang: locale } = useTranslation();
  const { orgs, user: currentUser } = useUser();

  const [langs, setLangs] = useState<string[]>([]);
  useEffect(() => {
    async function fetchLangs(langCodes: string[]): Promise<void> {
      const options = await langsToOptions(langCodes, locale);
      setLangs(options.map((o) => o.label));
    }
    if (!user?.langs) return;
    void fetchLangs(user.langs);
  }, [user?.langs, locale]);

  const subjects = useMemo(() => {
    if (!user) return [];
    if (org?.aspects.length === 1) return user[org.aspects[0]].subjects;
    if (isAspect(query.aspect)) return user[query.aspect].subjects;
    // Many subjects can be both tutoring and mentoring subjects, thus we filter
    // for unique subjects (e.g. to prevent "Computer Science" duplications).
    const unique = new Set<string>();
    user.tutoring.subjects.forEach((s) => unique.add(s));
    user.mentoring.subjects.forEach((s) => unique.add(s));
    return [...unique];
  }, [org, query.aspect, user]);

  const admin = useMemo(() => orgs.some((o) => user?.orgs.includes(o.id)), [
    orgs,
    user?.orgs,
  ]);

  return (
    <div className={cn({ [styles.loading]: !user })}>
      {(!user || user.background) && (
        <div className={styles.background}>
          {user?.background && (
            <Image
              layout='fill'
              objectFit='cover'
              data-cy='backdrop'
              objectPosition='center 50%'
              src={user.background}
            />
          )}
        </div>
      )}
      <div className={styles.content}>
        <div className={styles.left}>
          <a
            className={styles.img}
            href={user?.photo || ''}
            target='_blank'
            rel='noreferrer'
            tabIndex={-1}
          >
            <Avatar size={260} loading={!user} src={user?.photo} />
            {currentUser.id !== user?.id && admin && (
              <div className={styles.actions}>
                <Link href={`/${org?.id || ''}/users/${user?.id || ''}/edit`}>
                  <IconButton icon='edit' label='Edit user' />
                </Link>
                <Link href={`/${org?.id || ''}/users/${user?.id || ''}/vet`}>
                  <IconButton icon='fact_check' label='Vet user' />
                </Link>
              </div>
            )}
          </a>
          <h1 data-cy='name' className={styles.name}>
            {user && user.name}
          </h1>
          {(!user || !!user.socials.length) && (
            <div data-cy='socials' className={styles.socials}>
              {(user ? user.socials : []).map((social) => (
                <a
                  data-cy={`${social.type}-social-link`}
                  key={social.type}
                  target='_blank'
                  rel='noreferrer'
                  href={social.url}
                  className={`${styles.socialLink} ${styles[social.type]}`}
                >
                  {social.type}
                </a>
              ))}
              {!!user?.email && (
                <a
                  data-cy='email-social-link'
                  target='_blank'
                  rel='noreferrer'
                  href={`mailto:${encodeURIComponent(
                    `"${user.name}"<${user.email}>`
                  )}`}
                  className={`${styles.socialLink} ${styles.email}`}
                >
                  {user.email}
                </a>
              )}
            </div>
          )}
        </div>
        <div className={styles.right}>
          <h2>{user && 'About'}</h2>
          <p>{user && user.bio}</p>
          {!user && (
            <>
              <h2 />
              <p className={styles.subjects} />
            </>
          )}
          {!user && (
            <>
              <h2 />
              <form className={styles.form} />
            </>
          )}
          {user && !!subjects.length && (
            <>
              <h2>Teaches</h2>
              <p>{join(subjects)}</p>
            </>
          )}
          {user && !!langs.length && (
            <>
              <h2>Speaks</h2>
              <p>{join(langs)}</p>
            </>
          )}
          {user && (
            <>
              <h2>Request</h2>
              <RequestForm admin={admin} user={user || new User()} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
