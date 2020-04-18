import Link from 'next/link';
import { LinkProps } from './interfaces';

import BlackWordmark from './svgs/black-wordmark.svg';
import WhiteWordmark from './svgs/white-wordmark.svg';
import BlackLogo from './svgs/black-logo.svg';
import WhiteLogo from './svgs/white-logo.svg';

import styles from './desktop.module.scss';

function NavItem(props: LinkProps) {
  return (
    <li className={styles.menuItem}>
      <NavLink href={props.href} label={props.label} />
    </li>
  );
}

function NavLink(props: LinkProps) {
  if (props.href.indexOf('http') < 0)
    return (
      <Link href={props.href}>
        <a className={styles.menuItemLink}>{props.label}</a>
      </Link>
    );
  return (
    <a className={styles.menuItemLink} href={props.href}>
      {props.label}
    </a>
  );
}

export default function Nav(props: { white?: boolean }) {
  return (
    <div className={styles.contentWrapper}>
      <Link href='/'>
        <a className={styles.logoLink} aria-label='Tutorbook Home'>
          <div className={styles.wordmark}>
            <img
              className={styles.wordmarkImg}
              src={props.white ? WhiteWordmark : BlackWordmark}
            />
          </div>
          <div className={styles.logo}>
            <img
              className={styles.logoImg}
              src={props.white ? WhiteLogo : BlackLogo}
            />
          </div>
        </a>
      </Link>
      <div className={styles.menuRightContainer}>
        <nav className={styles.menuItemWrapper}>
          <ul role='menubar' className={styles.menuOptionsList}>
            <NavItem href='/pupils' label='For students' />
            <NavItem href='/tutors' label='For volunteers' />
            <NavItem
              href='https://github.com/tutorbookapp/covid-tutoring'
              label='For developers'
            />
          </ul>
        </nav>
      </div>
    </div>
  );
}
