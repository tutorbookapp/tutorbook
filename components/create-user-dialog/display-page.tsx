import React, { memo, useCallback } from 'react';
import Avatar from 'components/avatar';
import { IconButton } from '@rmwc/icon-button';
import { Chip, ChipSet } from '@rmwc/chip';
import { UserJSON, SocialInterface } from 'lib/model';

import styles from './display-page.module.scss';

export interface DisplayPageProps {
  value: UserJSON;
  openEdit: () => Promise<void>;
  openRequest: () => Promise<void>;
  openMatch: () => Promise<void>;
  onClosed: () => void;
}

export default memo(function DisplayPage({
  value,
  openEdit,
  openRequest,
  openMatch,
  onClosed,
}: DisplayPageProps): JSX.Element {
  const email = useCallback(() => {
    open(`mailto:${encodeURIComponent(`"${value.name}"<${value.email}>`)}`);
  }, []);

  return (
    <div className={styles.wrapper}>
      <div className={styles.nav}>
        <IconButton className={styles.btn} icon='close' onClick={onClosed} />
      </div>
      <div className={styles.content}>
        <div className={styles.left}>
          <a
            className={styles.img}
            href={value.photo}
            target='_blank'
            rel='noreferrer'
            tabIndex={-1}
          >
            <Avatar src={value.photo} />
          </a>
          <h4 className={styles.name}>{value.name}</h4>
          {value.socials && !!value.socials.length && (
            <div className={styles.socials}>
              {value.socials.map((social: SocialInterface) => (
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
          <p className={styles.text}>{value.bio}</p>
        </div>
      </div>
      <div className={styles.actions}>
        <ChipSet className={styles.chips}>
          <Chip icon='edit' label='Edit profile' onClick={openEdit} />
          <Chip icon='send' label='Send request' onClick={openRequest} />
          <Chip icon='email' label='Send email' onClick={email} />
          <Chip icon='people' label='Match student' onClick={openMatch} />
        </ChipSet>
      </div>
    </div>
  );
});
