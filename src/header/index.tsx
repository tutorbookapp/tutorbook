import { Link } from '@tutorbook/intl';
import { User, Query, Aspect, Callback } from '@tutorbook/model';
import { useUser } from '@tutorbook/firebase';

import React from 'react';
import Banner from './banner';
import FilterForm from '@tutorbook/filter-form';

import styles from './header.module.scss';

interface HeaderProps {
  aspect?: Aspect;
  query?: Query;
  onChange?: Callback<Query | Aspect>;
  formWidth?: boolean;
}

function DesktopTabs({
  aspect,
  onChange,
}: {
  aspect: Aspect;
  onChange?: Callback<Aspect>;
}): JSX.Element {
  if (onChange)
    return (
      <div className={styles.tabs}>
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
    );
  return (
    <div className={styles.tabs}>
      <Link href='/search?aspect=mentoring'>
        <a className={styles.tab}>Mentoring</a>
      </Link>
      <Link href='/search?aspect=tutoring'>
        <a className={styles.tab}>Tutoring</a>
      </Link>
    </div>
  );
}

function Logo(): JSX.Element {
  return (
    <Link href='/'>
      <div className={styles.logo}>
        <span>TB</span>
      </div>
    </Link>
  );
}

function MobileNav({ user }: { user: User }): JSX.Element {
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
    <>
      <div className={styles.mobileToggle} onClick={toggleMobileMenu}>
        <div
          className={styles.toggle + (active ? ' ' + styles.toggleActive : '')}
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
              <li className={styles.mobileLinkItem}>Signup</li>
            </a>
          </Link>
        </ul>
      </nav>
    </>
  );
}

function DesktopNav({ user }: { user: User }): JSX.Element {
  return (
    <div className={styles.desktopLinks}>
      <Link href='/signup'>
        <a className={styles.desktopLink}>{user.uid ? 'Profile' : 'Signup'}</a>
      </Link>
    </div>
  );
}

export default function Header({
  query,
  aspect,
  onChange,
  formWidth,
}: HeaderProps): JSX.Element {
  const { user } = useUser();
  return (
    <>
      <Banner />
      <div
        className={styles.wrapper + (formWidth ? ' ' + styles.formWidth : '')}
      >
        <header className={styles.header}>
          <div className={styles.left}>
            <Logo />
            {aspect && <DesktopTabs aspect={aspect} onChange={onChange} />}
            {query && (
              <DesktopTabs
                aspect={query.aspect}
                onChange={(aspect: Aspect) =>
                  onChange && onChange({ ...query, aspect })
                }
              />
            )}
          </div>
          <div className={styles.center}>
            {query && (
              <FilterForm
                query={query}
                onChange={(query: Query) => onChange && onChange(query)}
              />
            )}
          </div>
          <div className={styles.right}>
            <MobileNav user={user} />
            <DesktopNav user={user} />
          </div>
        </header>
      </div>
    </>
  );
}
