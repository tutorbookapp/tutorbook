import React from 'react';

import { User, Query } from '@tutorbook/model';

import QueryForm from '@tutorbook/query-form';
import Results from './results';

import styles from './search.module.scss';

interface SearchProps {
  readonly results: ReadonlyArray<User>;
  readonly query: Query;
}

export default function Search({ query, results }: SearchProps): JSX.Element {
  return (
    <div className={styles.wrapper}>
      <div className={styles.formWrapper}>
        <QueryForm query={query} />
      </div>
      <div className={styles.resultsWrapper}>
        <Results query={query} results={results} />
      </div>
    </div>
  );
}
