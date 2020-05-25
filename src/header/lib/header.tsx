import React from 'react';

import styles from './styles.module.scss';

export default function Header(): JSX.Element {
  const [active, setActive] = React.useState<0 | 1>(0);
  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <aside className={styles.upper}>
          <div className={styles.logo}>
            <span>TB</span>
          </div>
          <div className={styles.mobile}></div>
        </aside>
        <aside className={styles.lower}>
          <div className={styles.desktop}>
            <div className={styles.left}>
              <a
                className={
                  styles.link + (active === 0 ? ' ' + styles.active : '')
                }
                onClick={() => setActive(0)}
              >
                Mentoring
              </a>
              <a
                className={
                  styles.link + (active === 1 ? ' ' + styles.active : '')
                }
                onClick={() => setActive(1)}
              >
                Tutoring
              </a>
            </div>
            <div className={styles.right}>
              <a className={styles.link}>Blog</a>
              <a className={styles.link}>Support</a>
              <a className={styles.link}>Docs</a>
            </div>
          </div>
        </aside>
      </header>
    </div>
  );
}
