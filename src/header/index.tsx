import { Link } from '@tutorbook/intl';
import { User, Query, Aspect, Callback } from '@tutorbook/model';
import { useUser } from '@tutorbook/firebase';

import React from 'react';
import FilterForm from '@tutorbook/filter-form';
import Banner from './banner';

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
  onChange: Callback<Aspect>;
}): JSX.Element {
  return (
    <div className={styles.tabs}>
      <button
        role='tab'
        type='button'
        className={
          styles.tab + (aspect === 'mentoring' ? ` ${styles.active}` : '')
        }
        onClick={() => onChange('mentoring')}
      >
        Mentoring
      </button>
      <button
        role='tab'
        type='button'
        className={
          styles.tab + (aspect === 'tutoring' ? ` ${styles.active}` : '')
        }
        onClick={() => onChange('tutoring')}
      >
        Tutoring
      </button>
    </div>
  );
}

function DesktopTabLinks(): JSX.Element {
  return (
    /* eslint-disable jsx-a11y/anchor-is-valid */
    <div className={styles.tabs}>
      <Link href='/search?aspect=mentoring'>
        <a className={styles.tab}>Mentoring</a>
      </Link>
      <Link href='/search?aspect=tutoring'>
        <a className={styles.tab}>Tutoring</a>
      </Link>
    </div>
    /* eslint-enable jsx-a11y/anchor-is-valid */
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
    const menuActive = !active;
    if (menuActive) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    setActive(menuActive);
  };
  return (
    /* eslint-disable jsx-a11y/anchor-is-valid */
    <>
      <div
        className={styles.mobileToggle}
        onClick={toggleMobileMenu}
        role='button'
      >
        <div
          className={styles.toggle + (active ? ` ${styles.toggleActive}` : '')}
        />
      </div>
      <nav
        className={
          styles.mobileNav + (active ? ` ${styles.mobileNavActive}` : '')
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
    /* eslint-enable jsx-a11y/anchor-is-valid */
  );
}

function DesktopNav({ user }: { user: User }): JSX.Element {
  return (
    /* eslint-disable jsx-a11y/anchor-is-valid */
    <div className={styles.desktopLinks}>
      <Link href='/signup'>
        <a className={styles.desktopLink}>{user.uid ? 'Profile' : 'Signup'}</a>
      </Link>
    </div>
    /* eslint-enable jsx-a11y/anchor-is-valid */
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
        className={styles.wrapper + (formWidth ? ` ${styles.formWidth}` : '')}
      >
        <header className={styles.header}>
          <div className={styles.left}>
            <Logo />
            {!aspect && !query && <DesktopTabLinks />}
            {aspect && (
              <DesktopTabs
                aspect={aspect}
                onChange={(newAspect: Aspect) =>
                  onChange && onChange(newAspect)
                }
              />
            )}
            {query && (
              <DesktopTabs
                aspect={query.aspect}
                onChange={(newAspect: Aspect) =>
                  onChange && onChange({ ...query, aspect: newAspect })
                }
              />
            )}
          </div>
          <div className={styles.center}>
            {query && (
              <FilterForm
                query={query}
                onChange={(newQuery: Query) => onChange && onChange(newQuery)}
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
