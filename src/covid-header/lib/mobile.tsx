import React from 'react';

import { Link } from '@tutorbook/intl';
import { NavItem, NavProps, LinkProps } from './covid-header';

import BlackLogo from './svgs/black-logo.svg';
import WhiteLogo from './svgs/white-logo.svg';

import styles from './mobile.module.scss';

export default function Nav(props: NavProps): JSX.Element {
  const [open, setOpen] = React.useState(false);
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
          {props.links.map((link: LinkProps, index: number) => (
            <NavItem
              {...link}
              key={index}
              menuItemClassName={styles.menuItem}
              menuItemLinkClassName={styles.menuItemLink}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}
