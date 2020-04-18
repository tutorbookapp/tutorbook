import { useState } from 'react';

import Link from 'next/link';
import { LinkProps } from './interfaces';

import BlackLogo from './svgs/black-logo.svg';
import WhiteLogo from './svgs/white-logo.svg';

import styles from './mobile.module.scss';

function NavItem(props: LinkProps) {
  return (
    <li className={styles.mobileNavItem}>
      <NavLink href={props.href} label={props.label} />
    </li>
  );
}

function NavLink(props: LinkProps) {
  if (props.href.indexOf('http') < 0)
    return (
      <Link href={props.href}>
        <a className={styles.mobileNavLink}>{props.label}</a>
      </Link>
    );
  return (
    <a className={styles.mobileNavLink} href={props.href}>
      {props.label}
    </a>
  );
}

export default function Nav(props: { white?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={styles.contentWrapper}>
      <Link href='/'>
        <a aria-label='Tutorbook Home'>
          <img
            className={styles.logoImg}
            src={props.white ? WhiteLogo : BlackLogo}
          />
        </a>
      </Link>
      <button
        id='open-menu-btn'
        type='button'
        onClick={() => setOpen(!open)}
        className={
          styles.menuButtonWrapper +
          (open ? ' ' + styles.menuButtonWrapperActive : '')
        }
        aria-label='Open and close navigation menu'
        aria-haspopup='true'
      >
        <span className={styles.menuLine + ' ' + styles.menuLineTop}></span>
        <span className={styles.menuLine + ' ' + styles.menuLineBottom}></span>
      </button>
      <div
        className={styles.menu + (open ? ' ' + styles.menuActive : '')}
        aria-hidden='true'
        role='menu'
      >
        <ul className={styles.categoryWrapper}>
          <NavItem href='/pupils/' label='For students' />
          <NavItem href='/tutors/' label='For volunteers' />
          <NavItem
            href='https://github.com/tutorbookapp/covid-tutoring'
            label='For developers'
          />
        </ul>
      </div>
    </div>
  );
}
