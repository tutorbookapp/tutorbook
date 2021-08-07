import { useEffect, useState } from 'react';
import Link from 'next/link';
import cn from 'classnames';

import Avatar from 'components/avatar';

import { useOrg } from 'lib/context/org';
import { useUser } from 'lib/context/user';

import Tabs, { TabsProps } from './tabs';
import PopOver from './pop-over';
import Switcher from './switcher';
import styles from './navigation.module.scss';

function Logo(): JSX.Element {
  const { user } = useUser();
  const { org } = useOrg();

  return (
    <Link href={user.id ? '/overview' : `/${org?.id || ''}`}>
      <a className={styles.logo}>
        <span>TB</span>
      </a>
    </Link>
  );
}

function DesktopNav(): JSX.Element {
  const { user, loggedIn } = useUser();
  const [open, setOpen] = useState<boolean>(false);
  return (
    <div className={styles.desktopLinks}>
      {loggedIn === false && (
        <Link href='/login'>
          <a className={`${styles.desktopLink} ${styles.loginLink}`}>Login</a>
        </Link>
      )}
      {loggedIn === undefined && (
        <div className={styles.avatar}>
          <Avatar size={40} loading />
        </div>
      )}
      {loggedIn === true && (
        <PopOver open={open} onClose={() => setOpen(false)}>
          <button
            type='button'
            id='open-nav'
            className={styles.avatar}
            onClick={() => setOpen(true)}
          >
            <Avatar size={40} src={user.photo} />
          </button>
        </PopOver>
      )}
    </div>
  );
}

interface TabHeaderProps extends TabsProps {
  switcher?: boolean;
}

export function TabHeader({ switcher, ...rest }: TabHeaderProps): JSX.Element {
  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <div className={styles.left}>
          <Logo />
          {switcher && <Switcher />}
          <Tabs {...rest} />
        </div>
        <div className={styles.right}>
          <DesktopNav />
        </div>
      </header>
    </div>
  );
}

interface EmptyHeaderProps {
  formWidth?: boolean;
  borderless?: boolean;
}

export function EmptyHeader({
  formWidth,
  borderless,
}: EmptyHeaderProps): JSX.Element {
  const [scrolled, setScrolled] = useState<boolean>(false);
  useEffect(() => {
    const listener = () => setScrolled(window.scrollY > 0);
    window.addEventListener('scroll', listener);
    return () => window.removeEventListener('scroll', listener);
  }, []);
  return (
    <div
      className={cn(styles.wrapper, {
        [styles.formWidth]: formWidth,
        [styles.borderless]: borderless && !scrolled,
      })}
    >
      <header className={styles.header}>
        <div className={styles.left}>
          <Logo />
        </div>
        <div className={styles.right}>
          <DesktopNav />
        </div>
      </header>
    </div>
  );
}
