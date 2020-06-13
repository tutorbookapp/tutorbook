import React from 'react';

import styles from './tabs.module.scss';

interface TabProps {
  label: string;
  onClick: () => void;
  active?: boolean;
}

function Tab({ label, onClick, active }: TabProps): JSX.Element {
  const className = styles.tab + (active ? ` ${styles.active}` : '');
  return (
    <button role='tab' type='button' className={className} onClick={onClick}>
      {label}
    </button>
  );
}

interface TabsProps {
  tabs: string[];
  active: string;
  onChange: (tab: string) => void;
}

export default function Tabs({
  tabs,
  active,
  onChange,
}: TabsProps): JSX.Element {
  return (
    <div className={styles.tabs}>
      {tabs.map((tab: string) => (
        <Tab
          key={tab}
          label={tab}
          active={active === tab}
          onClick={() => onChange(tab)}
        />
      ))}
    </div>
  );
}
