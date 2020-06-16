import React from 'react';

import { useIntl, defMsg, Msg, IntlShape, IntlHelper } from '@tutorbook/intl';
import { Callback, Option, Timeslot, User, Query } from '@tutorbook/model';
import { v4 as uuid } from 'uuid';

import Carousel from '@tutorbook/carousel';
import RequestDialog from '@tutorbook/request-dialog';
import Utils from '@tutorbook/utils';
import Result from './result';
import Form from './form';

import styles from './search.module.scss';

interface SearchProps {
  readonly onChange: Callback<Query>;
  readonly results: ReadonlyArray<User>;
  readonly searching: boolean;
  readonly query: Query;
  readonly user?: User;
}

const msgs: Record<string, Msg> = defMsg({
  noResultsTitle: {
    id: 'search.no-results.title',
    defaultMessage: 'No Results',
  },
  noResultsBody: {
    id: 'search.no-results.body',
    defaultMessage:
      "We couldn't find anyone matching those filters. But here are some " +
      'suggestions:',
  },
});

export default function Search({
  user,
  query,
  results,
  searching,
  onChange,
}: SearchProps): JSX.Element {
  const intl: IntlShape = useIntl();
  const msg: IntlHelper = (message: Msg) => intl.formatMessage(message);

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
        <RequestDialog
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
          <h3 className={styles.noResultsHeader}>{msg(msgs.noResultsTitle)}</h3>
          <p className={styles.noResultsBody}>{msg(msgs.noResultsBody)}</p>
          <Carousel aspect={query.aspect} onClick={setViewing} />
        </div>
      )}
    </div>
  );
}
