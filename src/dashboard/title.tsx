import React from 'react';

import styles from './title.module.scss';

interface TitleProps {
  header: string;
  body: string;
}

export default function Title({ header, body }: TitleProps): JSX.Element {
  return (
    <header className={styles.wrapper}>
      <div className={styles.content}>
        <div className={styles.title}>
          <h1 className={styles.header}>{header}</h1>
          <p className={styles.body}>{body}</p>
        </div>
      </div>
    </header>
  );
}
