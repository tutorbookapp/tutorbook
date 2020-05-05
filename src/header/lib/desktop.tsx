import React from 'react';
import Link from 'next/link';

import { NavItem, NavProps, LinkProps } from './covid-header';

import BlackWordmark from './svgs/black-wordmark.svg';
import WhiteWordmark from './svgs/white-wordmark.svg';
import BlackLogo from './svgs/black-logo.svg';
import WhiteLogo from './svgs/white-logo.svg';

import styles from './desktop.module.scss';

export default function Nav(props: NavProps): JSX.Element {
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
            {props.links.map((link: LinkProps, index: number) => (
              <NavItem
                {...link}
                key={index}
                menuItemClassName={styles.menuItem}
                menuItemLinkClassName={styles.menuItemLink}
              />
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
