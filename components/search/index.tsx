import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
} from 'react';

import useTranslation from 'next-translate/useTranslation';

import {
  TCallback,
  Option,
  Availability,
  Timeslot,
  User,
  UsersQuery,
} from 'lib/model';
import { v4 as uuid } from 'uuid';

import Carousel from 'components/carousel';
import RequestDialog from 'components/request-dialog';
import Utils from 'lib/utils';
import Result from './result';
import Form from './form';

import styles from './search.module.scss';

interface SearchProps {
  onChange: TCallback<UsersQuery>;
  results: ReadonlyArray<User>;
  searching: boolean;
  query: UsersQuery;
  user?: User;
}

export default function Search({
  user,
  query,
  results,
  searching,
  onChange,
}: SearchProps): JSX.Element {
  const [viewing, setViewing] = useState<User | undefined>(user);
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

  const onClosed = useCallback(() => setViewing(undefined), []);

  const subjects = useMemo(() => {
    if (!viewing) return [];
    return Utils.intersection<string, Option<string>>(
      viewing[query.aspect].subjects,
      query.subjects,
      (a: string, b: Option<string>) => a === b.value
    );
  }, [viewing, query.aspect, query.subjects]);

  const times = useMemo(() => {
    if (!viewing) return new Availability();
    const possible = Utils.intersection<Timeslot, Timeslot>(
      query.availability,
      viewing.availability,
      (a: Timeslot, b: Timeslot) => a.equalTo(b)
    );
    if (!possible.length) return new Availability();
    const start = possible[0].from;
    let end = possible[0].to;
    if (end.valueOf() - start.valueOf() >= 3600000) {
      end = new Date(start.valueOf() + 3600000);
    }
    return new Availability(new Timeslot(start, end));
  }, [viewing, query.availability]);

  return (
    <div className={styles.wrapper}>
      {viewing && (
        <RequestDialog
          user={viewing}
          aspect={query.aspect}
          onClosed={onClosed}
          subjects={subjects}
          times={times}
        />
      )}
      <Form query={query} onChange={onChange} />
      {searching && !results.length && (
        <ul className={styles.results}>
          {Array(5)
            .fill(null)
            .map(() => (
              <Result loading key={uuid()} />
            ))}
        </ul>
      )}
      {!!results.length && (
        <ul className={styles.results}>
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
        <div className={styles.noResults}>
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
