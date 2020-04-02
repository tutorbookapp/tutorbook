import { LinkProps } from './interfaces'

import Wordmark from './svgs/wordmark.svg'
import Logo from './svgs/logo.svg'

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

function Nav() {
  return (
    <div className={styles.contentWrapper}>
      <a className={styles.logoLink} href="/" aria-label="Tutorbook Home">
        <div className={styles.wordmark}>
          <img className={styles.wordmarkImg} src={Wordmark} />
        </div>
        <div className={styles.logo}>
          <img className={styles.logoImg} src={Logo} />
        </div>
      </a>
      <div className={styles.menuRightContainer}>
        <nav className={styles.menuItemWrapper}>
          <ul role="menubar" className={styles.menuOptionsList}>
            <Item href='/tutors' label='For volunteers' />
            <Item href='/docs' label='For developers' />
            <Item href='#' label='FAQ' />
          </ul>
        </nav>
      </div>
    </div>
  );
}

export default Nav
