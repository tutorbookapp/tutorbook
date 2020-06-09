import React from 'react';

import { Option, Timeslot, User, Query } from '@tutorbook/model';

import Carousel from '@tutorbook/carousel';
import UserDialog from '@tutorbook/user-dialog';
import Utils from '@tutorbook/utils';
import Result from './result';
import Form from './form';

import styles from './search.module.scss';

interface SearchProps {
  readonly onChange: (query: Query) => any;
  readonly results: ReadonlyArray<User>;
  readonly searching: boolean;
  readonly query: Query;
  readonly user?: User;
}

export default function Search({
  user,
  query,
  results,
  searching,
  onChange,
}: SearchProps): JSX.Element {
  const [viewing, setViewing] = React.useState<User | undefined>(user);
  const [elevated, setElevated] = React.useState<boolean>(false);
  const formRef: React.RefObject<HTMLDivElement> = React.createRef();

  React.useEffect(() => {
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
      {viewing && (
        <UserDialog
          user={viewing}
          aspect={query.aspect}
          onClosed={() => setViewing(undefined)}
          subjects={Utils.intersection<Option<string>, string>(
            query.subjects,
            viewing[query.aspect].subjects,
            (a: Option<string>, b: string) => a.value === b
          )}
          time={
            Utils.intersection<Timeslot, Timeslot>(
              query.availability,
              viewing.availability,
              (a: Timeslot, b: Timeslot) => a.equalTo(b)
            )[0]
          }
        />
      )}
      <Form query={query} onChange={onChange} />
      {searching && !results.length && (
        <ul className={styles.results}>
          {Array(5)
            .fill(null)
            .map((_: null, index: number) => (
              <Result loading key={index} />
            ))}
        </ul>
      )}
      {!!results.length && (
        <ul className={styles.results}>
          {results.map((res: User, index: number) => (
            <Result
              user={res}
              key={res.uid || index}
              onClick={() => setViewing(res)}
            />
          ))}
        </ul>
      )}
      {!searching && !results.length && (
        <div className={styles.noResults}>
          <h3 className={styles.noResultsHeader}>No Results</h3>
          <p className={styles.noResultsBody}>
            We couldn't find anyone matching those filters. But here are some
            suggestions:
          </p>
          <Carousel aspect={query.aspect} onClick={setViewing} />
        </div>
      )}
    </div>
  );
}
