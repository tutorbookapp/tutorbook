import React from 'react';

import { Link } from '@tutorbook/intl';
import { Aspect } from '@tutorbook/model';

import styles from './header.module.scss';

interface HeaderProps {
  aspect: Aspect;
  onChange: (aspect: Aspect) => any;
}

export default function Header({ aspect, onChange }: HeaderProps): JSX.Element {
  const [active, setActive] = React.useState<boolean>(false);
  const toggleMobileMenu = () => {
    const menuActive: boolean = !active;
    if (menuActive) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    setActive(menuActive);
  };
  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <div className={styles.left}>
          <Link href='/'>
            <div className={styles.logo}>
              <span>TB</span>
            </div>
          </Link>
          <div
            className={styles.tabs + (active ? ' ' + styles.tabsHidden : '')}
          >
            <a
              className={
                styles.tab + (aspect === 'mentoring' ? ' ' + styles.active : '')
              }
              onClick={() => onChange('mentoring')}
            >
              Mentoring
            </a>
            <a
              className={
                styles.tab + (aspect === 'tutoring' ? ' ' + styles.active : '')
              }
              onClick={() => onChange('tutoring')}
            >
              Tutoring
            </a>
          </div>
        </div>
        <div className={styles.mobileToggle} onClick={toggleMobileMenu}>
          <div
            className={
              styles.toggle + (active ? ' ' + styles.toggleActive : '')
            }
          />
        </div>
        <nav
          className={
            styles.mobileNav + (active ? ' ' + styles.mobileNavActive : '')
          }
        >
          <ul className={styles.mobileLinks}>
            <a className={styles.mobileLink} href='/volunteers'>
              <li className={styles.mobileLinkItem}>Become a mentor</li>
            </a>
            <a className={styles.mobileLink} href='/volunteers'>
              <li className={styles.mobileLinkItem}>Become a tutor</li>
            </a>
          </ul>
        </nav>
        <div className={styles.desktopLinks}>
          <a className={styles.desktopLink} href='/volunteers'>
            Become a mentor
          </a>
          <a className={styles.desktopLink} href='/volunteers'>
            Become a tutor
          </a>
        </div>
      </header>
    </div>
  );
}
