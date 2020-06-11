import { MenuSurfaceAnchor, MenuSurface } from '@rmwc/menu';
import { Link } from '@tutorbook/intl';
import { User, Query, Aspect, Callback } from '@tutorbook/model';
import { useUser } from '@tutorbook/firebase';

import React from 'react';
import Avatar from '@tutorbook/avatar';
import FilterForm from '@tutorbook/filter-form';
import Banner from './banner';
import PopOver from './pop-over';

import styles from './header.module.scss';

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
              <li className={styles.mobileLinkItem}>
                {user.id ? 'Profile' : 'Signup'}
              </li>
            </a>
          </Link>
        </ul>
      </nav>
    </>
    /* eslint-enable jsx-a11y/anchor-is-valid */
  );
}

function DesktopNav({ user }: { user: User }): JSX.Element {
  const [open, setOpen] = React.useState<boolean>(false);
  if (user.id)
    return (
      <PopOver open={open} onClose={() => setOpen(false)}>
        <button
          type='button'
          className={styles.avatar}
          onClick={() => setOpen(true)}
        >
          <Avatar src={user.photo} />
        </button>
      </PopOver>
    );
  return (
    /* eslint-disable jsx-a11y/anchor-is-valid */
    <div className={styles.desktopLinks}>
      <Link href='/signup'>
        <a className={styles.desktopLink}>Signup</a>
      </Link>
    </div>
    /* eslint-enable jsx-a11y/anchor-is-valid */
  );
}

interface LinkHeaderProps {
  formWidth?: boolean;
}

export function LinkHeader({ formWidth }: LinkHeaderProps): JSX.Element {
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
            <DesktopTabLinks />
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

interface AspectHeaderProps extends LinkHeaderProps {
  aspect: Aspect;
  onChange: Callback<Aspect>;
}

export function AspectHeader({
  aspect,
  onChange,
  formWidth,
}: AspectHeaderProps): JSX.Element {
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
            <DesktopTabs aspect={aspect} onChange={onChange} />
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

interface QueryHeaderProps extends LinkHeaderProps {
  query: Query;
  onChange: Callback<Query>;
}

export function QueryHeader({
  query,
  onChange,
  formWidth,
}: QueryHeaderProps): JSX.Element {
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
            <DesktopTabs
              aspect={query.aspect}
              onChange={(aspect: Aspect) => onChange({ ...query, aspect })}
            />
          </div>
          <div className={styles.center}>
            <FilterForm query={query} onChange={onChange} />
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
