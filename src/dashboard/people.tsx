import { v4 as uuid } from 'uuid';

import React from 'react';
import Result from '@tutorbook/search/result';
import Title from './title';

import styles from './people.module.scss';

export default function People(): JSX.Element {
  return (
    <>
      <Title
        header='People'
        body='Pending sign-ups that have yet to be vetted.'
      />
      <ul className={styles.results}>
        {Array(5)
          .fill(null)
          .map(() => (
            <Result loading key={uuid()} />
          ))}
      </ul>
    </>
  );
}
