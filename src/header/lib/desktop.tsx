import { LinkProps } from './interfaces'

import BlackWordmark from './svgs/black-wordmark.svg'
import WhiteWordmark from './svgs/white-wordmark.svg'
import BlackLogo from './svgs/black-logo.svg'
import WhiteLogo from './svgs/white-logo.svg'

import styles from './desktop.module.scss'

function Item(props: LinkProps) {
  return (
    <li className={styles.menuItem}>
      <Link href={props.href} label={props.label} />
    </li>
  );
}

function Link(props: LinkProps) {
  return (
    <a href={props.href} className={styles.menuItemLink}>
      {props.label}
    </a>
  );
}

export default function Nav(props: { white?: boolean; }) {
  return (
    <div className={styles.contentWrapper}>
      <a className={styles.logoLink} href="/" aria-label="Tutorbook Home">
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
      <div className={styles.menuRightContainer}>
        <nav className={styles.menuItemWrapper}>
          <ul role="menubar" className={styles.menuOptionsList}>
            <Item href='/pupils' label='For students' />
            <Item href='/tutors' label='For volunteers' />
            <Item href='/docs' label='For developers' />
            <Item href='#' label='FAQ' />
          </ul>
        </nav>
      </div>
    </div>
  );
}
