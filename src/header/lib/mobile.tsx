import { useState } from 'react';

import { LinkProps } from './interfaces';

import BlackLogo from './svgs/black-logo.svg';
import WhiteLogo from './svgs/white-logo.svg';

import styles from './mobile.module.scss';

function Item(props: LinkProps) {
  return (
    <li className={styles.mobileNavItem}>
      <Link href={props.href} label={props.label} />
    </li>
  );
}

function Link(props: LinkProps) {
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
      <a href='/' aria-label='Tutorbook Home'>
        <img
          className={styles.logoImg}
          src={props.white ? WhiteLogo : BlackLogo}
        />
      </a>
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
          <Item href='/pupils/' label='For students' />
          <Item href='/tutors/' label='For volunteers' />
          <Item href='/docs/' label='For developers' />
          <Item href='#' label='FAQ' />
        </ul>
      </div>
    </div>
  );
}
