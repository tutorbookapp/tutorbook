import { IconButton } from '@rmwc/icon-button';
import Image from 'next/image';
import Link from 'next/link';
import cn from 'classnames';
import { useMemo } from 'react';
import useTranslation from 'next-translate/useTranslation';

import Avatar from 'components/avatar';
import Button from 'components/button';
import RequestForm from 'components/user/request-form';

import { User } from 'lib/model';
import { join } from 'lib/utils';
import { useOrg } from 'lib/context/org';
import { useUser } from 'lib/context/user';

import styles from './display.module.scss';

export interface UserDisplayProps {
  user?: User;
  langs?: string[];
  subjects?: string[];
}

export default function UserDisplay({
  user,
  langs,
  subjects,
}: UserDisplayProps): JSX.Element {
  const { org } = useOrg();
  const { t } = useTranslation();
  const { orgs, user: currentUser } = useUser();

  const admin = useMemo(() => orgs.some((o) => user?.orgs.includes(o.id)), [
    orgs,
    user?.orgs,
  ]);

  return (
    <div data-cy='user-display' className={cn({ [styles.loading]: !user })}>
      <div className={styles.background}>
        {(user?.background || user?.photo) && (
          <Image
            priority
            layout='fill'
            objectFit='cover'
            data-cy='backdrop'
            objectPosition='center 50%'
            src={user?.background || user?.photo}
            className={cn({ [styles.blurred]: !user?.background })}
          />
        )}
        {user && !user.background && !user.photo && <span>No Banner</span>}
      </div>
      <div className={styles.content}>
        <div className={styles.left}>
          <a
            className={styles.img}
            href={user?.photo || ''}
            target='_blank'
            rel='noreferrer'
            tabIndex={-1}
          >
            <Avatar size='dynamic' loading={!user} src={user?.photo} priority />
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
            </div>
          )}
        </div>
        <div className={styles.right}>
          {(!user || user.bio) && (
            <>
              <h2>{user && 'About'}</h2>
              <p data-cy='bio'>{user && user.bio}</p>
            </>
          )}
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
          {user && !!subjects?.length && (
            <>
              <h2>Teaches</h2>
              <p data-cy='subjects'>{join(subjects)}</p>
            </>
          )}
          {user && !!langs?.length && (
            <>
              <h2>Speaks</h2>
              <p data-cy='langs'>{join(langs)}</p>
            </>
          )}
          {user && !org?.matchURL && (
            <RequestForm admin={admin} user={user || new User()} />
          )}
          {user && org?.matchURL && (
            <>
              <h2>Request</h2>
              <p>
                {t('common:picktime-body', { org: org.name, user: user.name })}
              </p>
              <Button
                href={org.matchURL}
                label={t('common:picktime-btn')}
                raised
                arrow
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
