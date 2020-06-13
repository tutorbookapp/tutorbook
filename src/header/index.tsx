import {
  useIntl,
  defMsg,
  Link,
  IntlShape,
  IntlHelper,
  Msg,
} from '@tutorbook/intl';
import { Query, Aspect, Callback } from '@tutorbook/model';
import { useAccount } from '@tutorbook/firebase';

import React from 'react';
import Avatar from '@tutorbook/avatar';
import FilterForm from '@tutorbook/filter-form';
import Banner from './banner';
import PopOver from './pop-over';
import Tabs from './tabs';

import styles from './header.module.scss';

const tabLabels: Record<Aspect, Msg> = defMsg({
  mentoring: {
    id: 'header.tabs.mentoring',
    defaultMessage: 'Mentors',
  },
  tutoring: {
    id: 'header.tabs.tutoring',
    defaultMessage: 'Tutors',
  },
});

function DesktopTabs({
  aspect,
  onChange,
}: {
  aspect: Aspect;
  onChange: Callback<Aspect>;
}): JSX.Element {
  const intl: IntlShape = useIntl();
  const aspectToTab: Record<Aspect, string> = Object.fromEntries(
    Object.entries(tabLabels).map(([k, v]) => [k, intl.formatMessage(v)])
  ) as Record<Aspect, string>;
  const tabToAspect: Record<string, Aspect> = Object.fromEntries(
    Object.entries(aspectToTab).map(([k, v]) => [v, k])
  ) as Record<string, Aspect>;
  return (
    <Tabs
      tabs={Object.values(aspectToTab)}
      active={aspectToTab[aspect]}
      onChange={(tab: string) => onChange(tabToAspect[tab])}
    />
  );
}

function DesktopTabLinks(): JSX.Element {
  const intl: IntlShape = useIntl();
  const msg: IntlHelper = (message: Msg) => intl.formatMessage(message);
  return (
    /* eslint-disable jsx-a11y/anchor-is-valid */
    <div className={styles.desktopLinks}>
      <Link href='/search?aspect=mentoring'>
        <a className={styles.desktopLink}>{msg(tabLabels.mentoring)}</a>
      </Link>
      <Link href='/search?aspect=tutoring'>
        <a className={styles.desktopLink}>{msg(tabLabels.tutoring)}</a>
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

function MobileNav(): JSX.Element {
  const { account } = useAccount();
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
                {account.id ? 'Profile' : 'Signup'}
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
  const { account } = useAccount();
  const [open, setOpen] = React.useState<boolean>(false);
  if (account.id)
    return (
      <PopOver open={open} onClose={() => setOpen(false)}>
        <button
          type='button'
          className={styles.avatar}
          onClick={() => setOpen(true)}
        >
          <Avatar src={account.photo} />
        </button>
      </PopOver>
    );
  return (
    /* eslint-disable jsx-a11y/anchor-is-valid */
    <div className={styles.desktopLinks}>
      <Link href='/signup'>
        <a className={`${styles.desktopLink} ${styles.signUpLink}`}>Signup</a>
      </Link>
    </div>
    /* eslint-enable jsx-a11y/anchor-is-valid */
  );
}

interface TabHeaderProps {
  tabs: string[];
  active: string;
  onChange: (tab: string) => void;
}

export function TabHeader({
  tabs,
  active,
  onChange,
}: TabHeaderProps): JSX.Element {
  return (
    <>
      <Banner />
      <div className={styles.wrapper}>
        <header className={styles.header}>
          <div className={styles.left}>
            <Logo />
            <Tabs tabs={tabs} active={active} onChange={onChange} />
          </div>
          <div className={styles.right}>
            <DesktopTabLinks />
            <DesktopNav />
          </div>
        </header>
      </div>
    </>
  );
}

interface LinkHeaderProps {
  formWidth?: boolean;
}

export function LinkHeader({ formWidth }: LinkHeaderProps): JSX.Element {
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
            <MobileNav />
            <DesktopNav />
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
            <MobileNav />
            <DesktopNav />
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
            <MobileNav />
            <DesktopNav />
          </div>
        </header>
      </div>
    </>
  );
}
