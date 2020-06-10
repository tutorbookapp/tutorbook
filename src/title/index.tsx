import React from 'react';

import styles from './title.module.scss';

export default function Title({ children }: { children: string }): JSX.Element {
  return <h1 className={styles.title}>{children}</h1>;
}
