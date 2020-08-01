import React from 'react';
import Avatar from 'components/avatar';
import { Chip, ChipSet } from '@rmwc/chip';
import { UserJSON, SocialInterface } from 'lib/model';

import styles from './display-page.module.scss';

export interface DisplayPageProps {
  value: UserJSON;
  openEdit: () => void;
  openRequest: () => void;
  openMatch: () => void;
}

export default function DisplayPage({
  value,
  openEdit,
  openRequest,
  openMatch,
}: DisplayPageProps): JSX.Element {
  return (
    <div className={styles.wrapper}>
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
        <p className={styles.content}>{value.bio}</p>
        <h6 className={styles.header}>Contact</h6>
        <p className={styles.content}>{value.bio}</p>
        <h6 className={styles.header}>Subjects</h6>
        <p className={styles.content}>{value.bio}</p>
        <ChipSet className={styles.chips}>
          <Chip icon='edit' label='Edit profile' onClick={openEdit} />
          <Chip icon='send' label='Request tutor' onClick={openRequest} />
          <Chip icon='people' label='Match student' onClick={openMatch} />
        </ChipSet>
      </div>
    </div>
  );
}
