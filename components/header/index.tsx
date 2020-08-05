import { UsersQuery, Aspect, Callback } from 'lib/model';
import { useUser } from 'lib/account';

import cn from 'classnames';
import useTranslation from 'next-translate/useTranslation';

import React, { useState, useCallback } from 'react';
import Link from 'lib/intl/link';
import Avatar from 'components/avatar';
import FilterForm from 'components/filter-form';
import PopOver from './pop-over';
import Switcher from './switcher';
import Tabs, { TabsProps } from './tabs';

import styles from './header.module.scss';

function DesktopTabs({
  aspect,
  onChange,
}: {
  aspect: Aspect;
  onChange: Callback<Aspect>;
}): JSX.Element {
  const { t } = useTranslation();
  return (
    <Tabs
      tabs={[
        {
          label: t('common:mentors'),
          active: aspect === 'mentoring',
          onClick: () => onChange('mentoring'),
        },
        {
          label: t('common:tutors'),
          active: aspect === 'tutoring',
          onClick: () => onChange('tutoring'),
        },
      ]}
    />
  );
}

function DesktopTabLinks(): JSX.Element {
  const { t } = useTranslation();
  return (
    /* eslint-disable jsx-a11y/anchor-is-valid */
    <div className={styles.desktopLinks}>
      <Link href='/search/[[...slug]]' as='/search?aspect=mentoring'>
        <a className={styles.desktopLink}>{t('common:mentors')}</a>
      </Link>
      <Link href='/search/[[...slug]]' as='/search?aspect=tutoring'>
        <a className={styles.desktopLink}>{t('common:tutors')}</a>
      </Link>
    </div>
    /* eslint-enable jsx-a11y/anchor-is-valid */
  );
}

function Logo(): JSX.Element {
  const { user } = useUser();
  return (
    /* eslint-disable jsx-a11y/anchor-is-valid */
    <Link href={user.id ? '/dashboard' : '/'}>
      <a className={styles.logo}>
        <span>TB</span>
      </a>
    </Link>
    /* eslint-enable jsx-a11y/anchor-is-valid */
  );
}

function MobileNav(): JSX.Element {
  const { user } = useUser();
  const { t } = useTranslation();
  const [active, setActive] = useState<boolean>(false);
  const toggleMobileMenu = useCallback(() => {
    setActive((prev: boolean) => {
      const menuActive = !prev;
      if (menuActive) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
      return menuActive;
    });
  }, []);
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
                {user.id ? t('common:profile') : t('common:signup')}
              </li>
            </a>
          </Link>
        </ul>
      </nav>
    </>
    /* eslint-enable jsx-a11y/anchor-is-valid */
  );
}

function DesktopNav(): JSX.Element {
  const { user, loggedIn } = useUser();
  const { t } = useTranslation();
  const [open, setOpen] = React.useState<boolean>(false);
  return (
    /* eslint-disable jsx-a11y/anchor-is-valid */
    <div className={styles.desktopLinks}>
      {loggedIn === false && (
        <>
          <Link href='/login'>
            <a className={`${styles.desktopLink} ${styles.loginLink}`}>
              {t('common:login')}
            </a>
          </Link>
          <Link href='/signup'>
            <a className={`${styles.desktopLink} ${styles.signupLink}`}>
              {t('common:signup')}
            </a>
          </Link>
        </>
      )}
      {loggedIn === undefined && (
        <div className={styles.avatar}>
          <Avatar loading />
        </div>
      )}
      {loggedIn === true && (
        <PopOver open={open} onClose={() => setOpen(false)}>
          <button
            type='button'
            className={styles.avatar}
            onClick={() => setOpen(true)}
          >
            <Avatar src={user.photo} />
          </button>
        </PopOver>
      )}
    </div>
    /* eslint-enable jsx-a11y/anchor-is-valid */
  );
}

export function TabHeader(props: TabsProps): JSX.Element {
  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <div className={styles.left}>
          <Logo />
          <Switcher />
          <Tabs {...props} />
        </div>
        <div className={styles.right}>
          <DesktopTabLinks />
          <DesktopNav />
        </div>
      </header>
    </div>
  );
}

interface LinkHeaderProps {
  formWidth?: boolean;
}

export function LinkHeader({ formWidth }: LinkHeaderProps): JSX.Element {
  return (
    <div className={cn(styles.wrapper, { [styles.formWidth]: formWidth })}>
      <header className={styles.header}>
        <div className={styles.left}>
          <Logo />
          <DesktopTabLinks />
        </div>
        <div className={styles.right}>
          <MobileNav />
          <DesktopNav />
        </div>
      </header>
    </div>
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
  return (
    <div className={cn(styles.wrapper, { [styles.formWidth]: formWidth })}>
      <header className={styles.header}>
        <div className={styles.left}>
          <Logo />
          <DesktopTabs aspect={aspect} onChange={onChange} />
        </div>
        <div className={styles.right}>
          <MobileNav />
          <DesktopNav />
        </div>
      </header>
    </div>
  );
}

interface QueryHeaderProps extends LinkHeaderProps {
  query: UsersQuery;
  onChange: Callback<UsersQuery>;
}

export function QueryHeader({
  query,
  onChange,
  formWidth,
}: QueryHeaderProps): JSX.Element {
  return (
    <div className={cn(styles.wrapper, { [styles.formWidth]: formWidth })}>
      <header className={styles.header}>
        <div className={styles.left}>
          <Logo />
          <DesktopTabs
            aspect={query.aspect}
            onChange={(aspect: Aspect) =>
              onChange(new UsersQuery({ ...query, aspect }))
            }
          />
        </div>
        <div className={styles.center}>
          <FilterForm query={query} onChange={onChange} />
        </div>
        <div className={styles.right}>
          <MobileNav />
          <DesktopNav />
        </div>
      </header>
    </div>
  );
}
