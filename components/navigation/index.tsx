import { useEffect, useState } from 'react';
import Link from 'next/link';
import cn from 'classnames';
import useTranslation from 'next-translate/useTranslation';

import Avatar from 'components/avatar';

import { Aspect } from 'lib/model/aspect';
import { TCallback } from 'lib/model/callback';
import { useOrg } from 'lib/context/org';
import { useUser } from 'lib/context/user';

import Tabs, { TabsProps } from './tabs';
import PopOver from './pop-over';
import Switcher from './switcher';
import styles from './navigation.module.scss';

interface DesktopTabsProps {
  aspect: Aspect;
  onChange: TCallback<Aspect>;
}

function DesktopTabs({ aspect, onChange }: DesktopTabsProps): JSX.Element {
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
}

export function EmptyHeader({ formWidth }: EmptyHeaderProps): JSX.Element {
  const [borderless, setBorderless] = useState<boolean>(true);
  useEffect(() => {
    const listener = () => setBorderless(window.scrollY <= 0);
    window.addEventListener('scroll', listener);
    return () => window.removeEventListener('scroll', listener);
  }, []);
  return (
    <div
      className={cn(styles.wrapper, {
        [styles.formWidth]: formWidth,
        [styles.borderless]: borderless,
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

interface AspectHeaderProps extends EmptyHeaderProps {
  aspect: Aspect;
  onChange: TCallback<Aspect>;
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
          <DesktopNav />
        </div>
      </header>
    </div>
  );
}
