import { Dialog } from '@rmwc/dialog';
import { User, SocialInterface } from 'lib/model';

import React from 'react';
import Avatar from 'components/avatar';
import Loader from 'components/loader';

import styles from './user-dialog.module.scss';

interface UserDialogProps {
  user: User;
  onClosed: () => void;
  children?: JSX.Element | JSX.Element[];
  submitting?: boolean;
  submitted?: boolean;
  className?: string;
}

export default function UserDialog({
  children,
  className,
  submitting,
  submitted,
  onClosed,
  user,
}: UserDialogProps): JSX.Element {
  return (
    <Dialog
      open
      onClosed={onClosed}
      className={styles.dialog + (className ? ` ${className}` : '')}
    >
      <div className={styles.wrapper}>
        <Loader active={submitting || submitted || false} checked={submitted} />
        <div className={styles.left}>
          <a
            className={styles.img}
            href={user.photo}
            target='_blank'
            rel='noreferrer'
            tabIndex={-1}
          >
            <Avatar src={user.photo} />
          </a>
          <h4 className={styles.name}>{user.name}</h4>
          {user.socials && !!user.socials.length && (
            <div className={styles.socials}>
              {user.socials.map((social: SocialInterface) => (
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
          <h6 className={styles.bioHeader}>About</h6>
          <p className={styles.bio}>{user.bio}</p>
          {children}
        </div>
      </div>
    </Dialog>
  );
}
