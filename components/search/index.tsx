import { useEffect, useMemo, useRef, useState } from 'react';
import useTranslation from 'next-translate/useTranslation';
import { v4 as uuid } from 'uuid';

import Carousel from 'components/carousel';

import { Callback, User, UsersQuery } from 'lib/model';

import Form from './form';
import Result from './result';
import styles from './search.module.scss';

interface SearchProps {
  onChange: Callback<UsersQuery>;
  results: ReadonlyArray<User>;
  searching: boolean;
  query: UsersQuery;
  setViewing: Callback<User | undefined>;
}

export default function Search({
  query,
  results,
  searching,
  onChange,
  setViewing,
}: SearchProps): JSX.Element {
  const [elevated, setElevated] = useState<boolean>(false);

  const { t } = useTranslation();
  const formRef = useRef<HTMLDivElement | null>();
  const noResultsQuery = useMemo(() => {
    return new UsersQuery({ aspect: query.aspect, visible: true });
  }, [query.aspect]);

  useEffect(() => {
    const listener = () => {
      if (!formRef.current) return;
      const viewportOffset = formRef.current.getBoundingClientRect();
      const updated: boolean = viewportOffset.top <= 74;
      // We have to wait a tick before changing the class for the animation to
      // work. @see {@link https://stackoverflow.com/a/37643388/10023158}
      if (updated !== elevated) setTimeout(() => setElevated(updated), 100);
    };
    window.addEventListener('scroll', listener);
    return () => window.removeEventListener('scroll', listener);
  });

  return (
    <div className={styles.wrapper}>
      <Form query={query} onChange={onChange} />
      {searching && !results.length && (
        <ul data-cy='results' className={styles.results}>
          {Array(5)
            .fill(null)
            .map(() => (
              <Result loading key={uuid()} />
            ))}
        </ul>
      )}
      {!!results.length && (
        <ul data-cy='results' className={styles.results}>
          {results.map((res: User) => (
            <Result
              user={res}
              key={res.id || uuid()}
              onClick={() => setViewing(res)}
            />
          ))}
        </ul>
      )}
      {!searching && !results.length && (
        <div data-cy='no-results' className={styles.noResults}>
          <h3 className={styles.noResultsHeader}>
            {t('search:no-results-title')}
          </h3>
          <p className={styles.noResultsBody}>{t('search:no-results-body')}</p>
          <Carousel query={noResultsQuery} onClick={setViewing} />
        </div>
      )}
    </div>
  );
}
