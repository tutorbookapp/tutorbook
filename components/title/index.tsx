import { ReactNode } from 'react';

import styles from './title.module.scss';

export interface TitleProps {
  children: ReactNode;
}

export default function Title({ children }: TitleProps): JSX.Element {
  return (
    <h1 data-cy='title' className={styles.title}>
      {children}
    </h1>
  );
}
