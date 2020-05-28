import React from 'react';

import { Link } from '@tutorbook/intl';
import { Aspect } from '@tutorbook/model';

import styles from './header.module.scss';

interface HeaderProps {
  aspect: Aspect;
  onChange: (aspect: Aspect) => any;
}

export default function Header({ aspect, onChange }: HeaderProps): JSX.Element {
  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <aside className={styles.upper}>
          <Link href='/'>
            <div className={styles.logo}>
              <span>TB</span>
            </div>
          </Link>
          <div className={styles.mobile}></div>
        </aside>
        <aside className={styles.lower}>
          <div className={styles.desktop}>
            <div className={styles.left}>
              <a
                className={
                  styles.link +
                  (aspect === 'mentoring' ? ' ' + styles.active : '')
                }
                onClick={() => onChange('mentoring')}
              >
                Mentoring
              </a>
              <a
                className={
                  styles.link +
                  (aspect === 'tutoring' ? ' ' + styles.active : '')
                }
                onClick={() => onChange('tutoring')}
              >
                Tutoring
              </a>
            </div>
            <div className={styles.right}>
              <a className={styles.link}>Blog</a>
              <a className={styles.link}>Support</a>
              <a className={styles.link}>Docs</a>
            </div>
          </div>
        </aside>
      </header>
    </div>
  );
}
