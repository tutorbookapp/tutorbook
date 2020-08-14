import React from 'react';
import cn from 'classnames';

import Link from 'lib/intl/link';

import styles from './tabs.module.scss';

interface TabProps {
  label: string;
  active?: boolean;
}

interface TabButtonProps extends TabProps {
  onClick: () => void;
}

function TabButton({ label, onClick, active }: TabButtonProps): JSX.Element {
  return (
    <button
      role='tab'
      type='button'
      className={cn(styles.tab, { [styles.active]: active })}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

interface TabLinkProps extends TabProps {
  href: string;
  as?: string;
}

function TabLink({ label, href, as, active }: TabLinkProps): JSX.Element {
  if (href.indexOf('http') < 0)
    return (
      /* eslint-disable jsx-a11y/anchor-is-valid */
      <Link href={href} as={as}>
        <a className={cn(styles.tab, { [styles.active]: active })}>{label}</a>
      </Link>
      /* eslint-enable jsx-a11y/anchor-is-valid */
    );
  return (
    <a href={href} className={cn(styles.tab, { [styles.active]: active })}>
      {label}
    </a>
  );
}

export interface TabsProps {
  tabs: (TabLinkProps | TabButtonProps)[];
}

function isTabLinkProps(
  tab: TabLinkProps | TabButtonProps
): tab is TabLinkProps {
  return (tab as TabLinkProps).href !== undefined;
}

export default function Tabs({ tabs }: TabsProps): JSX.Element {
  return (
    <div className={styles.tabs}>
      {tabs.map((tab: TabLinkProps | TabButtonProps) =>
        isTabLinkProps(tab) ? (
          <TabLink key={tab.label} {...tab} />
        ) : (
          <TabButton key={tab.label} {...tab} />
        )
      )}
    </div>
  );
}
