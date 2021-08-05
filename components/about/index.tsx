import { useState } from 'react';
import Router from 'next/router';

import FilterForm from 'components/filter-form';
import Title from 'components/title';

import { UsersQuery } from 'lib/model/query/users';

import styles from './about.module.scss';

export default function About(): JSX.Element {
  const [query, setQuery] = useState<UsersQuery>(new UsersQuery());

  return (
    <main className={styles.wrapper}>
      <div className={styles.header}>
        <Title>Tutorbook: Airbnb for tutoring</Title>
      </div>
      <FilterForm
        query={query}
        onChange={setQuery}
        onSubmit={() => Router.push(query.getURL('/search'))}
      />
    </main>
  );
}
