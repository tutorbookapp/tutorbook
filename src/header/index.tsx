import React from 'react';

import { Link } from '@tutorbook/intl';
import { Aspect } from '@tutorbook/model';

import styles from './header.module.scss';

interface HeaderProps {
  aspect?: Aspect;
  onChange?: (aspect: Aspect) => any;
  formWidth?: boolean;
}

function Tabs({
  aspect,
  onChange,
}: Omit<HeaderProps, 'formWidth'>): JSX.Element {
  if (onChange)
    return (
      <>
        <a
          className={
            styles.tab + (aspect === 'mentoring' ? ' ' + styles.active : '')
          }
          onClick={() => onChange && onChange('mentoring')}
        >
          Mentoring
        </a>
        <a
          className={
            styles.tab + (aspect === 'tutoring' ? ' ' + styles.active : '')
          }
          onClick={() => onChange && onChange('tutoring')}
        >
          Tutoring
        </a>
      </>
    );
  return (
    <>
      <Link href='/search?aspect=mentoring'>
        <a className={styles.tab}>Mentoring</a>
      </Link>
      <Link href='/search?aspect=tutoring'>
        <a className={styles.tab}>Tutoring</a>
      </Link>
    </>
  );
}

export default function Header({
  aspect,
  onChange,
  formWidth,
}: HeaderProps): JSX.Element {
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
    <div className={styles.wrapper + (formWidth ? ' ' + styles.formWidth : '')}>
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
            <Tabs aspect={aspect} onChange={onChange} />
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
            <Link href='/signup'>
              <a className={styles.mobileLink}>
                <li className={styles.mobileLinkItem}>Join TB</li>
              </a>
            </Link>
          </ul>
        </nav>
        <div className={styles.desktopLinks}>
          <Link href='/signup'>
            <a className={styles.desktopLink}>Join TB</a>
          </Link>
        </div>
      </header>
    </div>
  );
}
